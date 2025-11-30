import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue, QueueEvents } from 'bullmq'
import { REPORTS_JOBS_QUEUE } from './reports.constants'
import { ProcessActionsCSVJobResult } from './types/process-actions-csv-job-result.type'
import { ProcessActionsCSVResponseDto } from './dto/process-actions-csv-response.dto'
import { ProcessActionsCSVFilters } from './dto/process-actions-csv-request.dto'
import { ProcessActionsCSVRequestDto } from './dto/process-actions-csv-request.dto'
import { CsvExportRepository } from './csv-export.repository'

@Injectable()
export class ReportsService implements OnModuleInit, OnModuleDestroy {
  private queueEvents: QueueEvents

  constructor(
    private readonly csvExportRepository: CsvExportRepository,
    @InjectQueue(REPORTS_JOBS_QUEUE)
    private readonly reportsJobsQueue: Queue<
      ProcessActionsCSVRequestDto,
      ProcessActionsCSVJobResult
    >,
  ) {
    this.queueEvents = new QueueEvents(REPORTS_JOBS_QUEUE, {
      connection: { url: process.env.REDIS_URL },
    })
  }

  async onModuleInit() {
    await this.queueEvents.waitUntilReady()

    this.queueEvents.on('active', ({ jobId }) => {
      console.log(`[Reports Service] Job ${jobId} started`)

      this.csvExportRepository
        .create({
          outputPath: '',
          totalRowsProcessed: 0,
          duration: 0,
          jobId: String(jobId),
        })
        .catch((error) => {
          console.error(
            `Failed to create CSV export record for job ${jobId}:`,
            error,
          )
        })
    })

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`[Reports Service] Job ${jobId} progress:`, data)
    })

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(
        `[Reports Service] Job ${jobId} completed successfully`,
        returnvalue,
      )

      const result = returnvalue as unknown as ProcessActionsCSVJobResult
      if (result) {
        this.csvExportRepository
          .updateByJobId(String(jobId), {
            outputPath: result.outputPath,
            totalRowsProcessed: result.totalRowsProcessed,
            duration: result.duration,
          })
          .catch((error) => {
            console.error(
              `Failed to update CSV export record for job ${jobId}:`,
              error,
            )
          })
      }
    })

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.log(`[Reports Service] Job ${jobId} failed:`, failedReason)
    })
  }

  onModuleDestroy() {
    void this.queueEvents.close()
  }

  async processActionsCSV(
    filters: ProcessActionsCSVFilters,
  ): Promise<ProcessActionsCSVResponseDto> {
    const jobData: ProcessActionsCSVRequestDto = { filters }
    const job = await this.reportsJobsQueue.add('processActionsCSV', jobData)

    return { jobId: job.id, status: 'queued' }
  }
}
