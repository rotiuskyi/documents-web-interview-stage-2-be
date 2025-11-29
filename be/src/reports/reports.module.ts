import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { join } from 'node:path'
import { REPORTS_JOBS_QUEUE } from './reports.constants'
import { ReportsController } from './reports.controller'
import { ActionsModule } from 'actions/actions.module'

@Module({
  imports: [
    ActionsModule,
    BullModule.registerQueue({
      name: REPORTS_JOBS_QUEUE,
      processors: [
        {
          name: 'processActionsCSV',
          path: join(__dirname, './reports.processor.js'),
          concurrency: 2,
        },
      ],
    }),
  ],
  controllers: [ReportsController],
})
export class ReportsModule {}
