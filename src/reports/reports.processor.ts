import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { Job } from 'bullmq'
import { MikroORM } from '@mikro-orm/postgresql'
import { QueryOrder, Cursor } from '@mikro-orm/core'
import mikroOrmConfig from 'mikro-orm.config'
import { ActionEntity } from 'actions/action.entity'

type ColumnName = keyof Pick<ActionEntity, 'id' | 'actionType' | 'createdAt'> | 'userId' | 'userName'

const ACTIONS_SCV_COLUMNS: Array<ColumnName> = ['id', 'actionType', 'userId', 'userName', 'createdAt']
const ACTIONS_BATCH_SIZE = 1000;
let orm: MikroORM | null = null

async function getOrm(): Promise<MikroORM> {
  if (!orm) {
    orm = await MikroORM.init(mikroOrmConfig)
  }
  return orm;
}

function buildCSVRow(action: ActionEntity) {
  return ACTIONS_SCV_COLUMNS.map(cn => {
    switch (cn) {
      case 'id': return action.id.toString()
      case 'actionType': return action.actionType
      case 'userId': return action.user.id.toString()
      case 'userName': return action.user.name
      case 'createdAt': return action.createdAt.toISOString()
    }
  }).join(',') + '\n'
}

async function processActionsCSVReport(job: Job) {
  const orm = await getOrm();

  const outputDir = join(process.cwd(), 'temp')
  const outputPath = join(outputDir, `report-${job.id}.csv`)
  const writeStream = createWriteStream(outputPath)
  const csvHeader = ACTIONS_SCV_COLUMNS.join(',') + '\n'
  writeStream.write(csvHeader)

  let actionCursor: Cursor<ActionEntity> | undefined;
  while (true) {
    const result = await orm.em.findByCursor(ActionEntity, {}, {
      first: ACTIONS_BATCH_SIZE,
      after: actionCursor,
      orderBy: { id: QueryOrder.ASC },
    })

    const actions = result.items;
    for (const action of actions) {
      const csvRow = buildCSVRow(action)
      writeStream.write(csvRow)
    }

    if (actions.length === 0) {
      writeStream.end()
      break;
    }
    actionCursor = result
  }
}

export default processActionsCSVReport;
