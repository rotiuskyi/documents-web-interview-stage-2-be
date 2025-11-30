import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { join } from 'node:path'
import { ActionEntity } from 'actions/action.entity'
import { REPORTS_JOBS_QUEUE } from './reports.constants'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { CsvExportEntity } from './csv-export.entity'
import { CsvExportRepository } from './csv-export.repository'

@Module({
  imports: [
    MikroOrmModule.forFeature([ActionEntity, CsvExportEntity]),
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
  providers: [ReportsService, CsvExportRepository],
  controllers: [ReportsController],
})
export class ReportsModule {}
