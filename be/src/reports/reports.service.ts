import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { InjectRepository } from '@mikro-orm/nestjs'
import { InjectQueue } from '@nestjs/bullmq'
import {
  EntityRepository,
  FilterQuery,
  QueryOrder,
} from '@mikro-orm/postgresql'
import { Queue, QueueEvents } from 'bullmq'
import { ActionEntity } from 'actions/action.entity'
import { REPORTS_JOBS_QUEUE } from './reports.constants'
import { GetActionsQueryDto } from './dto/get-actions-query.dto'
import {
  GetActionsResponseDto,
  ActionResponseDto,
  PaginationMetaDto,
} from './dto/get-actions-response.dto'
import {
  ProcessActionsCSVJobData,
  ProcessActionsCSVJobResult,
} from './process-actions-csv-job.type'
import { ProcessActionsCSVResponseDto } from './dto/process-actions-csv-response.dto'
import { ProcessActionsCSVFiltersDto } from './dto/process-actions-csv-request.dto'

@Injectable()
export class ReportsService implements OnModuleInit, OnModuleDestroy {
  private queueEvents: QueueEvents

  constructor(
    @InjectRepository(ActionEntity)
    private readonly actionRepository: EntityRepository<ActionEntity>,

    @InjectQueue(REPORTS_JOBS_QUEUE)
    private readonly reportsJobsQueue: Queue<
      ProcessActionsCSVJobData,
      ProcessActionsCSVJobResult
    >,
  ) {
    this.queueEvents = new QueueEvents(REPORTS_JOBS_QUEUE, {
      connection: { url: process.env.REDIS_URL },
    })
  }

  onModuleInit() {
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`[Reports Service] Job ${jobId} completed successfully`)
      console.log('[Reports Service] Job return value:', returnvalue)
    })

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.log(`[Reports Service] Job ${jobId} failed:`, failedReason)
    })
  }

  onModuleDestroy() {
    void this.queueEvents.close()
  }

  async getActions(query: GetActionsQueryDto): Promise<GetActionsResponseDto> {
    const {
      after,
      limit = 200,
      userId,
      actionType,
      dateFrom,
      dateTo,
      metadataIp,
      metadataSign,
    } = query

    const em = this.actionRepository.getEntityManager()

    const where: FilterQuery<ActionEntity> = {}
    if (userId.length > 0) {
      where.user = { id: { $in: userId } }
    }
    if (actionType.length > 0) {
      where.actionType = { $in: actionType }
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.$lte = new Date(dateTo)
      }
    }
    if (metadataIp || metadataSign) {
      const metadataFilter: Partial<Record<'ip' | 'sign', string>> = {}
      if (metadataIp) {
        metadataFilter.ip = metadataIp
      }
      if (metadataSign) {
        metadataFilter.sign = metadataSign
      }
      where.metadata = metadataFilter as Record<'ip' | 'sign', string>
    }

    const cursorResult = await em.findByCursor(ActionEntity, where, {
      first: limit,
      ...(after && { after: { endCursor: after } }),
      orderBy: { id: QueryOrder.ASC },
      populate: ['user'],
    })
    const data = cursorResult.items as ActionResponseDto[]

    const pagination: PaginationMetaDto = {
      startCursor: cursorResult.startCursor,
      endCursor: cursorResult.endCursor,
      limit,
      hasNext: cursorResult.hasNextPage,
      hasPrev: cursorResult.hasPrevPage,
    }

    return { data, pagination }
  }

  async processActionsCSV(
    filters: ProcessActionsCSVFiltersDto,
  ): Promise<ProcessActionsCSVResponseDto> {
    const jobData: ProcessActionsCSVJobData = { filters }
    const job = await this.reportsJobsQueue.add('processActionsCSV', jobData)

    return { jobId: job.id, status: 'queued' }
  }
}
