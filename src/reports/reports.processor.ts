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
  createdAt: string
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
  return `${row.id},${row.actionType},${row.userId},"${row.userName}",${row.createdAt}\n`
}

async function processActionsCSV(job: Job<ProcessActionsCSVJob>) {
  console.log(
    `[Processor ${process.pid}] Starting processActionsCSV for job ${job.id}`,
  )
  console.log(
    `[Processor ${process.pid}] Filters:`,
    JSON.stringify(job.data.filters),
  )

  performance.mark('start')
  const orm = await getOrm()
  console.log(`[Processor ${process.pid}] ORM initialized`)

  const em = orm.em.fork()
  const connection = em.getConnection()
  const knex = connection.getKnex()
  console.log(`[Processor ${process.pid}] Got Knex connection`)

  // Access native PostgreSQL client through Knex
  console.log(`[Processor ${process.pid}] Acquiring native client...`)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const client = await knex.client.acquireConnection()
  console.log(`[Processor ${process.pid}] Native client acquired`)

  const outputDir = join(process.cwd(), 'temp')
  const outputPath = join(outputDir, `report-${job.id}.csv`)
  console.log(`[Processor ${process.pid}] Output path: ${outputPath}`)

  const writeStream = createWriteStream(outputPath)
  const csvHeader = ACTIONS_CSV_COLUMNS.join(',') + '\n'
  writeStream.write(csvHeader)
  console.log(`[Processor ${process.pid}] CSV header written`)

  const cursorName = `report_cursor_${job.id}`
  console.log(`[Processor ${process.pid}] Cursor name: ${cursorName}`)

  let totalRowsProcessed = 0
  let batchCount = 0

  try {
    // Start transaction (required for cursors)
    console.log(`[Processor ${process.pid}] Starting transaction...`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await client.query('BEGIN')
    console.log(`[Processor ${process.pid}] Transaction started`)

    // Declare cursor with the query
    const declareQuery = `DECLARE ${cursorName} CURSOR FOR
      SELECT 
        a.id,
        a.action_type as "actionType",
        a.created_at as "createdAt",
        u.id as "userId",
        u.name as "userName"
      FROM actions a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE u.id = ANY($1::int[])
      ORDER BY a.id ASC`

    console.log(
      `[Processor ${process.pid}] Declaring cursor with userIds:`,
      job.data.filters.userId,
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await client.query(declareQuery, [job.data.filters.userId])
    console.log(`[Processor ${process.pid}] Cursor declared successfully`)

    // Fetch batches from cursor
    while (true) {
      batchCount++
      console.log(
        `[Processor ${process.pid}] Fetching batch ${batchCount} (${ACTIONS_BATCH_SIZE} rows)...`,
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await client.query(
        `FETCH ${ACTIONS_BATCH_SIZE} FROM ${cursorName}`,
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const rows = result.rows
      console.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `[Processor ${process.pid}] Fetched ${rows.length} rows in batch ${batchCount}`,
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (rows.length === 0) {
        console.log(`[Processor ${process.pid}] No more rows, breaking loop`)
        break
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      for (const row of result.rows) {
        try {
          const csvRow = buildCSVRow(row as RowData)
          writeStream.write(csvRow)
          totalRowsProcessed++
        } catch (rowError) {
          console.error(
            `[Processor ${process.pid}] Error processing row:`,
            rowError,
          )
          console.error(`[Processor ${process.pid}] Row data:`, row)
        }
      }

      console.log(
        `[Processor ${process.pid}] Batch ${batchCount} processed. Total rows: ${totalRowsProcessed}`,
      )
    }

    console.log(
      `[Processor ${process.pid}] All batches processed. Closing write stream...`,
    )
    writeStream.end()
    console.log(
      `[Processor ${process.pid}] Write stream closed. Total rows written: ${totalRowsProcessed}`,
    )

    // Close cursor before committing
    console.log(`[Processor ${process.pid}] Closing cursor...`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await client.query(`CLOSE ${cursorName}`)
    console.log(`[Processor ${process.pid}] Cursor closed successfully`)

    // Commit transaction
    console.log(`[Processor ${process.pid}] Committing transaction...`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await client.query('COMMIT')
    console.log(`[Processor ${process.pid}] Transaction committed`)
  } catch (error) {
    console.error(
      `[Processor ${process.pid}] Error in processActionsCSV:`,
      error,
    )
    if (error instanceof Error) {
      console.error(`[Processor ${process.pid}] Error message:`, error.message)
      console.error(`[Processor ${process.pid}] Error stack:`, error.stack)
    }
    writeStream.destroy()

    // Close cursor and rollback transaction on error
    try {
      console.log(
        `[Processor ${process.pid}] Closing cursor before rollback...`,
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query(`CLOSE ${cursorName}`)
      console.log(`[Processor ${process.pid}] Cursor closed`)
    } catch (closeError) {
      console.error(
        `[Processor ${process.pid}] Error closing cursor:`,
        closeError,
      )
    }

    try {
      console.log(`[Processor ${process.pid}] Rolling back transaction...`)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query('ROLLBACK')
      console.log(`[Processor ${process.pid}] Transaction rolled back`)
    } catch (rollbackError) {
      console.error(
        `[Processor ${process.pid}] Error rolling back transaction:`,
        rollbackError,
      )
    }

    throw error
  } finally {
    // Try to close cursor if not already closed (in case of error)
    console.log(`[Processor ${process.pid}] Cleaning up...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query(`CLOSE ${cursorName}`)
      console.log(`[Processor ${process.pid}] Cursor closed in finally block`)
    } catch (closeError: any) {
      // Cursor might already be closed (code 34000 = cursor does not exist)
      // This is expected and harmless - cursor was already closed before commit
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (closeError?.code === '34000') {
        console.log(
          `[Processor ${process.pid}] Cursor already closed (expected)`,
        )
      } else {
        console.error(
          `[Processor ${process.pid}] Error closing cursor:`,
          closeError,
        )
      }
    }
    // Release connection back to pool
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await knex.client.releaseConnection(client)
      console.log(`[Processor ${process.pid}] Connection released to pool`)
    } catch (releaseError) {
      console.error(
        `[Processor ${process.pid}] Error releasing connection:`,
        releaseError,
      )
    }
  }

  performance.mark('end')
  performance.measure('processActionsCSV', 'start', 'end')
  const duration =
    performance.getEntriesByName('processActionsCSV')[0]?.duration
  console.log(
    `[Processor ${process.pid}] processActionsCSV finished in ${duration}ms. Processed ${totalRowsProcessed} rows in ${batchCount} batches`,
  )
}

export default processActionsCSV
