import { Entity, EntityDTO, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'csv_exports' })
export class CsvExportEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number

  @Property({ type: 'text' })
  outputPath!: string

  @Property({ type: 'integer' })
  totalRowsProcessed!: number

  @Property({ type: 'numeric', precision: 10, scale: 2 })
  duration!: number

  @Property({ type: 'text' })
  jobId!: string

  @Property({ type: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date()
}

export type CsvExportDto = EntityDTO<CsvExportEntity>
