import { Controller, Get } from '@nestjs/common'
import { ActionService } from 'actions/action.service'

@Controller('reports')
export class ReportsController {
  constructor(private readonly actionService: ActionService) {}

  @Get('actions')
  async getActionsReport() {
    const actions = await this.actionService.getFilteredActions()
    return { data: actions }
  }
}
