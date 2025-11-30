import {
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { ActionType } from '../action-type.enum'

export class GetActionsQueryDto {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Filter by user IDs',
    example: [1, 2],
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

  @ApiPropertyOptional({
    enum: ActionType,
    isArray: true,
    description: 'Filter by action types',
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

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by IP addresses in metadata',
  })
  @IsOptional()
  @Transform(({ value }): string[] => {
    if (Array.isArray(value)) {
      return value as string[]
    }
    return value ? [value as string] : []
  })
  @IsArray()
  @IsString({ each: true })
  metadataIp: string[] = []

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by zodiac signs in metadata',
  })
  @IsOptional()
  @Transform(({ value }): string[] => {
    if (Array.isArray(value)) {
      return value as string[]
    }
    return value ? [value as string] : []
  })
  @IsArray()
  @IsString({ each: true })
  metadataSign: string[] = []

  @ApiPropertyOptional({
    description: 'Cursor for pagination (from previous response endCursor)',
  })
  @IsOptional()
  @IsString()
  after?: string

  @ApiPropertyOptional({
    description: 'Number of items to fetch',
    minimum: 1,
    maximum: 10_000,
    default: 200,
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  limit?: number = 200
}
