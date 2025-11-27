import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { Job } from 'bullmq'
import { MikroORM } from '@mikro-orm/postgresql'
import mikroOrmConfig from 'mikro-orm.config'
import ProcessActionsCSVJob from './process-actions-csv.job'

type RowData = {
  id: number
  actionType: string
  userId: number
  userName: string
  createdAt: Date | string
}

const ACTIONS_CSV_COLUMNS = [
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

function buildCSVRow(row: RowData): string {
  return `${row.id},${row.actionType},${row.userId},"${row.userName}",${row.createdAt as string}\n`
}

async function processActionsCSV(job: Job<ProcessActionsCSVJob>) {
  performance.mark('start')
  const orm = await getOrm()
  const em = orm.em.fork()
  const connection = em.getConnection()
  const knex = connection.getKnex()

  const outputDir = join(process.cwd(), 'temp')
  const outputPath = join(outputDir, `report-${job.id}.csv`)
  const writeStream = createWriteStream(outputPath)
  const csvHeader = ACTIONS_CSV_COLUMNS.join(',') + '\n'
  writeStream.write(csvHeader)

  let lastId = 0
  while (true) {
    const rows = await knex
      .select([
        'a.id',
        'a.action_type as actionType',
        'a.created_at as createdAt',
        'u.id as userId',
        'u.name as userName',
      ])
      .from('actions as a')
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .where('a.id', '>', lastId)
      .whereIn('u.id', job.data.filters.userId)
      .orderBy('a.id', 'asc')
      .limit(ACTIONS_BATCH_SIZE)

    if (rows.length === 0) {
      writeStream.end()
      break
    }

    for (const row of rows) {
      const csvRow = buildCSVRow(row as RowData)
      writeStream.write(csvRow)
      lastId = (row as RowData).id
    }
  }

  performance.mark('end')
  performance.measure('processActionsCSV', 'start', 'end')
  console.log(
    `processActionsCSV finished in ${performance.getEntriesByName('processActionsCSV')[0].duration}ms`,
  )
}

export default processActionsCSV
