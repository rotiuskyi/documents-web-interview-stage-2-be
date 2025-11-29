import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ActionType } from 'actions/action-type.enum'

export class UserInfoDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  name: string
}

export class ActionResponseDto {
  @ApiProperty({ description: 'Action ID', example: 1 })
  id: number

  @ApiProperty({
    enum: ActionType,
    description: 'Type of action',
    example: ActionType.CONVERT,
  })
  actionType: ActionType

  @ApiProperty({ type: UserInfoDto, description: 'User information' })
  user: UserInfoDto

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { ip: '192.168.1.1', sign: 'Aries' },
  })
  metadata?: Record<string, any>

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date
}

export class PaginationMetaDto {
  @ApiPropertyOptional({
    description: 'Cursor for the first item in this page',
    example: 'eyJpZCI6MX0=',
    nullable: true,
  })
  startCursor: string | null

  @ApiPropertyOptional({
    description:
      'Cursor for the last item in this page (use this for next page)',
    example: 'eyJpZCI6NTB9',
    nullable: true,
  })
  endCursor: string | null

  @ApiProperty({ description: 'Number of items per page', example: 50 })
  limit: number

  @ApiProperty({
    description: 'Whether there are more items after this page',
    example: true,
  })
  hasNext: boolean

  @ApiProperty({
    description: 'Whether there are items before this page',
    example: false,
  })
  hasPrev: boolean
}

export class GetActionsResponseDto {
  @ApiProperty({
    type: [ActionResponseDto],
    description: 'Array of actions',
  })
  data: ActionResponseDto[]

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  pagination: PaginationMetaDto
}
