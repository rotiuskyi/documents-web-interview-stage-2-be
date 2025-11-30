import { InjectRepository } from '@mikro-orm/nestjs'
import { Injectable } from '@nestjs/common'
import { EntityRepository } from '@mikro-orm/postgresql'
import { CsvExportEntity } from './csv-export.entity'

@Injectable()
export class CsvExportRepository {
  constructor(
    @InjectRepository(CsvExportEntity)
    private readonly repository: EntityRepository<CsvExportEntity>,
  ) {}

  async create(data: {
    outputPath: string
    totalRowsProcessed: number
    duration: number
    jobId: string
  }): Promise<CsvExportEntity> {
    const em = this.repository.getEntityManager()
    const csvExport = new CsvExportEntity()
    csvExport.outputPath = data.outputPath
    csvExport.totalRowsProcessed = data.totalRowsProcessed
    csvExport.duration = data.duration
    csvExport.jobId = data.jobId
    await em.persistAndFlush(csvExport)
    return csvExport
  }

  async getCSVExports(): Promise<CsvExportEntity[]> {
    return this.repository.findAll({
      orderBy: { createdAt: 'DESC' },
      limit: 100,
    })
  }

  async updateByJobId(
    jobId: string,
    data: Partial<{
      outputPath: string
      totalRowsProcessed: number
      duration: number
    }>,
  ): Promise<CsvExportEntity | null> {
    const csvExport = await this.repository.findOne({ jobId })
    if (!csvExport) {
      return null
    }

    if (data.outputPath !== undefined) {
      csvExport.outputPath = data.outputPath
    }
    if (data.totalRowsProcessed !== undefined) {
      csvExport.totalRowsProcessed = data.totalRowsProcessed
    }
    if (data.duration !== undefined) {
      csvExport.duration = data.duration
    }

    const em = this.repository.getEntityManager()
    await em.persistAndFlush(csvExport)
    return csvExport
  }
}
