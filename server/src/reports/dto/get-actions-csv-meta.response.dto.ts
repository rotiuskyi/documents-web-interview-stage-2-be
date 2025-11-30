import { ApiProperty } from '@nestjs/swagger'

export class GetActionsCSVMetaResponseDto {
  @ApiProperty({
    description: 'Output path of the CSV file',
    example: '/path/to/csv/file.csv',
  })
  outputPath: string

  @ApiProperty({
    description: 'Total rows processed',
    example: 1_000,
  })
  totalRowsProcessed: number

  @ApiProperty({
    description: 'Duration of the export',
    example: 1_000,
  })
  duration: number

  @ApiProperty({
    description: 'Created at',
    example: '2021-01-01T00:00:00.000Z',
  })
  createdAt: Date
}
