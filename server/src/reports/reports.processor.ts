import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { Job } from 'bullmq'
import { MikroORM } from '@mikro-orm/postgresql'
import { FilterQuery, QueryOrder } from '@mikro-orm/core'
import mikroOrmConfig from 'mikro-orm.config'
import { ActionEntity } from 'actions/action.entity'
import { ProcessActionsCSVJobResult } from './types/process-actions-csv-job-result.type'
import { ProcessActionsCSVRequestDto } from './dto/process-actions-csv-request.dto'

type ColumnName =
  | keyof Pick<ActionEntity, 'id' | 'actionType' | 'createdAt'>
  | 'userId'
  | 'userName'

const ACTIONS_SCV_COLUMNS: Array<ColumnName> = [
  'id',
  'actionType',
  'userId',
  'userName',
  'createdAt',
]
const ACTIONS_BATCH_SIZE = 1000
let orm: MikroORM | null = null

async function getOrm(): Promise<MikroORM> {
  if (!orm) {
    orm = await MikroORM.init(mikroOrmConfig)
  }
  return orm
}

function buildCSVRow(action: ActionEntity) {
  return (
    ACTIONS_SCV_COLUMNS.map((cn) => {
      switch (cn) {
        case 'id':
          return action.id.toString()
        case 'actionType':
          return action.actionType
        case 'userId':
          return action.user.id.toString()
        case 'userName':
          return action.user.name
        case 'createdAt':
          return action.createdAt.toISOString()
      }
    }).join(',') + '\n'
  )
}

async function processActionsCSV(
  job: Job<ProcessActionsCSVRequestDto, ProcessActionsCSVJobResult>,
): Promise<ProcessActionsCSVJobResult> {
  performance.mark('start')
  await job.updateProgress(0)

  const orm = await getOrm()
  const em = orm.em.fork()

  const outputDir = join(process.cwd(), 'temp')
  const outputPath = join(outputDir, `report-${job.id}.csv`)
  const writeStream = createWriteStream(outputPath)
  const csvHeader = ACTIONS_SCV_COLUMNS.join(',') + '\n'
  writeStream.write(csvHeader)

  const baseWhere: FilterQuery<ActionEntity> = {}
  if (job.data.filters.userId.length > 0) {
    baseWhere.user = { id: { $in: job.data.filters.userId } }
  }
  if (job.data.filters.actionType.length > 0) {
    baseWhere.actionType = { $in: job.data.filters.actionType }
  }
  if (job.data.filters.dateFrom || job.data.filters.dateTo) {
    baseWhere.createdAt = {}
    if (job.data.filters.dateFrom) {
      baseWhere.createdAt.$gte = new Date(job.data.filters.dateFrom)
    }
    if (job.data.filters.dateTo) {
      baseWhere.createdAt.$lte = new Date(job.data.filters.dateTo)
    }
  }

  let lastId = 0
  let totalRowsProcessed = 0
  const totalCount = await em.count(ActionEntity, baseWhere)

  while (true) {
    const where: FilterQuery<ActionEntity> = { ...baseWhere }
    const actions = await em.find(
      ActionEntity,
      {
        ...where,
        // Use keyset pagination (id > lastId) to avoid count queries
        id: { $gt: lastId },
      },
      {
        limit: ACTIONS_BATCH_SIZE,
        orderBy: { id: QueryOrder.ASC },
        populate: ['user'],
      },
    )

    if (actions.length === 0) {
      writeStream.end()
      break
    }

    for (const action of actions) {
      const csvRow = buildCSVRow(action)
      writeStream.write(csvRow)
      lastId = action.id
      totalRowsProcessed++
    }

    const progressPercent =
      totalCount > 0
        ? Math.min(99, Math.round((totalRowsProcessed / totalCount) * 100))
        : 0

    await job.updateProgress(progressPercent)
  }

  performance.mark('end')
  performance.measure('processActionsCSV', 'start', 'end')
  const duration = performance.getEntriesByName('processActionsCSV')[0].duration
  await job.updateProgress(100)

  const jobResult: ProcessActionsCSVJobResult = {
    outputPath,
    totalRowsProcessed,
    duration,
    jobId: String(job.id),
  }
  return jobResult
}

export default processActionsCSV
