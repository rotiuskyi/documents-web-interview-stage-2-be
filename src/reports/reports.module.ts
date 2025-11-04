import { Module } from '@nestjs/common'
import { ReportsController } from './reports.controller'
import { ActionsModule } from 'actions/actions.module'

@Module({
  controllers: [ReportsController],
  imports: [ActionsModule],
})
export class ReportsModule {}
