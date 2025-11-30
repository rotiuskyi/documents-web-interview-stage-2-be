import { Controller, Get, Post, Query, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger'
import { ReportsService } from './reports.service'
import { GetActionsQueryDto } from './dto/get-actions-query.dto'
import { GetActionsResponseDto } from './dto/get-actions-response.dto'
import { ProcessActionsCSVRequestDto } from './dto/process-actions-csv-request.dto'
import { ProcessActionsCSVResponseDto } from './dto/process-actions-csv-response.dto'

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('actions')
  @ApiOperation({
    summary: 'Get filtered actions with cursor-based pagination',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved actions',
    type: GetActionsResponseDto,
  })
  async getActions(
    @Query() query: GetActionsQueryDto,
  ): Promise<GetActionsResponseDto> {
    return this.reportsService.getActions(query)
  }

  @Post('actions/csv_export')
  @ApiOperation({
    summary: 'Export actions to CSV',
    description:
      'Creates a background job to export filtered actions to a CSV file. Returns a job ID that can be used to track the export progress.',
  })
  @ApiBody({
    type: ProcessActionsCSVRequestDto,
    description: 'Filters for the CSV export',
  })
  @ApiOkResponse({
    description: 'Job queued successfully',
    type: ProcessActionsCSVResponseDto,
  })
  async processActionsCSV(
    @Body() body: ProcessActionsCSVRequestDto,
  ): Promise<ProcessActionsCSVResponseDto> {
    return this.reportsService.processActionsCSV(body.filters)
  }
}
