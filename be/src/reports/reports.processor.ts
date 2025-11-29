import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { Job } from 'bullmq'
import { MikroORM } from '@mikro-orm/postgresql'
import { QueryOrder } from '@mikro-orm/core'
import mikroOrmConfig from 'mikro-orm.config'
import { ActionEntity } from 'actions/action.entity'
import {
  ProcessActionsCSVJobData,
  ProcessActionsCSVJobResult,
} from './process-actions-csv-job.type'

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
  job: Job<ProcessActionsCSVJobData, ProcessActionsCSVJobResult>,
): Promise<ProcessActionsCSVJobResult> {
  performance.mark('start')
  const orm = await getOrm()
  const em = orm.em.fork()

  const outputDir = join(process.cwd(), 'temp')
  const outputPath = join(outputDir, `report-${job.id}.csv`)
  const writeStream = createWriteStream(outputPath)
  const csvHeader = ACTIONS_SCV_COLUMNS.join(',') + '\n'
  writeStream.write(csvHeader)

  let lastId = 0
  let totalRowsProcessed = 0

  await job.updateProgress(0)

  const totalCount = await em.count(ActionEntity, {
    user: { id: { $in: job.data.filters.userId } },
  })

  while (true) {
    const actions = await em.find(
      ActionEntity,
      {
        // Use keyset pagination (id > lastId) to avoid count queries
        id: { $gt: lastId },
        user: { id: { $in: job.data.filters.userId } },
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

  await job.updateProgress(100)

  performance.mark('end')
  performance.measure('processActionsCSV', 'start', 'end')
  const duration = performance.getEntriesByName('processActionsCSV')[0].duration
  console.log(`processActionsCSV finished in ${duration}ms`)

  return {
    outputPath,
    totalRowsProcessed,
    duration,
    jobId: job.id,
  }
}

export default processActionsCSV
