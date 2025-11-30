import { InjectRepository } from '@mikro-orm/nestjs'
import { Injectable } from '@nestjs/common'
import { ActionEntity } from './action.entity'
import {
  EntityRepository,
  FilterQuery,
  QueryOrder,
} from '@mikro-orm/postgresql'
import { GetActionsQueryDto } from './dto/get-actions-query.dto'
import {
  GetActionsResponseDto,
  ActionResponseData,
  PaginationMeta,
} from './dto/get-actions-response.dto'

@Injectable()
export class ActionRepository {
  constructor(
    @InjectRepository(ActionEntity)
    private readonly repository: EntityRepository<ActionEntity>,
  ) {}

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

    const em = this.repository.getEntityManager()

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
    const data = cursorResult.items as ActionResponseData[]

    const pagination: PaginationMeta = {
      startCursor: cursorResult.startCursor,
      endCursor: cursorResult.endCursor,
      limit,
      hasNext: cursorResult.hasNextPage,
      hasPrev: cursorResult.hasPrevPage,
    }

    return { data, pagination }
  }
}
