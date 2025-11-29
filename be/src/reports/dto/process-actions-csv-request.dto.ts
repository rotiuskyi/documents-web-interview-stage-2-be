import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator'
import { Transform } from 'class-transformer'
import { ActionType } from 'actions/action-type.enum'

export class ProcessActionsCSVFiltersDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of user IDs to filter actions',
    example: [1, 2, 3],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => Number(v))
    }
    return value ? [Number(value)] : []
  })
  @IsArray()
  @IsInt({ each: true })
  userId: number[] = []

  @ApiProperty({
    enum: ActionType,
    isArray: true,
    description: 'Array of action types to filter actions',
    example: [ActionType.CONVERT, ActionType.COMPRESS],
  })
  @IsOptional()
  @Transform(({ value }): ActionType[] => {
    if (Array.isArray(value)) {
      return value as ActionType[]
    }
    return value ? [value as ActionType] : []
  })
  @IsArray()
  @IsEnum(ActionType, { each: true })
  actionType: ActionType[] = []

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}

export class ProcessActionsCSVRequestDto {
  @ApiProperty({
    type: ProcessActionsCSVFiltersDto,
    description: 'Filters for the CSV export',
  })
  filters: ProcessActionsCSVFiltersDto
}
