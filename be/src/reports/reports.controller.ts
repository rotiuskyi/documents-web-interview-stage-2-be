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
  async getActions() {
    const actions = await this.actionService.getFilteredActions()
    return { data: actions }
  }

  @Post('actions/csv_export')
  async processActionsCSV() {
    await this.reportsJobsQueue.add('processActionsCSV', {
      filters: { userId: [1, 2] },
    })
  }
}
