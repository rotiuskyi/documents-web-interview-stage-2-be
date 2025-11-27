import { Controller, Get, Post } from '@nestjs/common'
import { ActionService } from 'actions/action.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { REPORTS_JOBS_QUEUE } from './reports.constants'

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly actionService: ActionService,
    @InjectQueue(REPORTS_JOBS_QUEUE) private readonly reportsJobsQueue: Queue,
  ) {}

  @Get('actions')
  async getActionsReport() {
    const actions = await this.actionService.getFilteredActions()
    return { data: actions }
  }

  @Post('export')
  async addActionsExportJob() {
    await this.reportsJobsQueue.add('csvExport', {
      exportType: 'csv',
      filters: ['foo', 'bar'],
    })
  }
}
