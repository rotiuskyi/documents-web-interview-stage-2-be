import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger'
import { ReportsService } from './reports.service'
import { ProcessActionsCSVRequestDto } from './dto/process-actions-csv-request.dto'
import { ProcessActionsCSVResponseDto } from './dto/process-actions-csv-response.dto'
import { CsvExportEntity } from './csv-export.entity'

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('csv_exports')
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

  @Get('csv_exports')
  @ApiOperation({
    summary: 'Get all CSV exports metadata',
    description: 'Returns a list of all CSV exports metadata.',
  })
  @ApiOkResponse({
    description: 'List of CSV exports',
    type: [CsvExportEntity],
  })
  async getCSVExports(): Promise<CsvExportEntity[]> {
    return this.reportsService.getCSVExports()
  }
}
