import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { join } from 'node:path'
import { ActionEntity } from 'actions/action.entity'
import { REPORTS_JOBS_QUEUE } from './reports.constants'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { ActionsModule } from 'actions/actions.module'

@Module({
  imports: [
    ActionsModule,
    MikroOrmModule.forFeature([ActionEntity]),
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
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
