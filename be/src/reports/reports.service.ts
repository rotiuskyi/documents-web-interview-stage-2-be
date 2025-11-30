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
import { ProcessActionsCSVJobResult } from './types/process-actions-csv-job-result.type'
import { ProcessActionsCSVResponseDto } from './dto/process-actions-csv-response.dto'
import { ProcessActionsCSVFilters } from './dto/process-actions-csv-request.dto'
import { ProcessActionsCSVRequestDto } from './dto/process-actions-csv-request.dto'
import { CsvExportRepository } from './csv-export.repository'

@Injectable()
export class ReportsService implements OnModuleInit, OnModuleDestroy {
  private queueEvents: QueueEvents

  constructor(
    @InjectRepository(ActionEntity)
    private readonly actionRepository: EntityRepository<ActionEntity>,

    @InjectQueue(REPORTS_JOBS_QUEUE)
    private readonly reportsJobsQueue: Queue<
      ProcessActionsCSVRequestDto,
      ProcessActionsCSVJobResult
    >,
    private readonly csvExportRepository: CsvExportRepository,
  ) {
    this.queueEvents = new QueueEvents(REPORTS_JOBS_QUEUE, {
      connection: { url: process.env.REDIS_URL },
    })
  }

  async onModuleInit() {
    await this.queueEvents.waitUntilReady()

    this.queueEvents.on('active', ({ jobId }) => {
      console.log(`[Reports Service] Job ${jobId} started`)
      // Create initial CSV export record when job starts
      void this.csvExportRepository
        .create({
          outputPath: '',
          totalRowsProcessed: 0,
          duration: 0,
          jobId: String(jobId),
        })
        .catch((error) => {
          console.error(
            `Failed to create CSV export record for job ${jobId}:`,
            error,
          )
        })
    })

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`[Reports Service] Job ${jobId} progress:`, data)
      // Update progress in database
      void this.csvExportRepository
        .updateByJobId(String(jobId), {
          progress: data as number,
        })
        .catch((error) => {
          console.error(`Failed to update progress for job ${jobId}:`, error)
        })
    })

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(
        `[Reports Service] Job ${jobId} completed successfully`,
        returnvalue,
      )
      // Update CSV export record with final results
      const result = returnvalue as unknown as ProcessActionsCSVJobResult
      if (result) {
        void this.csvExportRepository
          .updateByJobId(String(jobId), {
            outputPath: result.outputPath,
            totalRowsProcessed: result.totalRowsProcessed,
            duration: result.duration,
            progress: 100,
          })
          .catch((error) => {
            console.error(
              `Failed to update CSV export record for job ${jobId}:`,
              error,
            )
          })
      }
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
    if (metadataIp.length > 0 || metadataSign.length > 0) {
      const metadataFilter: Partial<
        Record<'ip' | 'sign', string | { $in: string[] }>
      > = {}
      if (metadataIp.length > 0) {
        metadataFilter.ip = { $in: metadataIp }
      }
      if (metadataSign.length > 0) {
        metadataFilter.sign = { $in: metadataSign }
      }
      where.metadata = metadataFilter as Record<string, any>
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
    filters: ProcessActionsCSVFilters,
  ): Promise<ProcessActionsCSVResponseDto> {
    const jobData: ProcessActionsCSVRequestDto = { filters }
    const job = await this.reportsJobsQueue.add('processActionsCSV', jobData)

    return { jobId: job.id, status: 'queued' }
  }
}
