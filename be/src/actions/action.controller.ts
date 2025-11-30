import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger'
import { ActionService } from './action.service'
import { GetActionsQueryDto } from './dto/get-actions-query.dto'
import { GetActionsResponseDto } from './dto/get-actions-response.dto'

@ApiTags('actions')
@Controller('actions')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Get()
  @ApiOperation({
    summary: 'Get filtered actions with cursor-based pagination',
    description:
      'Retrieve actions with optional filters by user IDs, action types, date range, and metadata fields. Uses cursor-based pagination for efficient data retrieval. Use the `after` parameter with the `endCursor` from the previous response to fetch the next page.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved actions',
    type: GetActionsResponseDto,
  })
  async getActions(
    @Query() query: GetActionsQueryDto,
  ): Promise<GetActionsResponseDto> {
    return this.actionService.getActions(query)
  }
}
