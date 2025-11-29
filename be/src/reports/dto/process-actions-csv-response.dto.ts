import { ApiProperty } from '@nestjs/swagger'

export class ProcessActionsCSVResponseDto {
  @ApiProperty({
    description: 'Job ID for tracking the export progress',
    example: '123',
  })
  jobId: string | number | undefined

  @ApiProperty({
    description: 'Status of the job',
    example: 'queued',
    enum: ['queued'],
  })
  status: string
}
