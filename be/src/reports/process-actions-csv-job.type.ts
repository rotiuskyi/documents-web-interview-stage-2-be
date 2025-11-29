import { ActionType } from 'actions/action-type.enum'

export type ProcessActionsCSVJobData = {
  filters: {
    userId?: number[]
    actionType?: ActionType[]
    dateFrom?: string
    dateTo?: string
  }
}

export type ProcessActionsCSVJobResult = {
  outputPath: string
  totalRowsProcessed: number
  duration: number
  jobId: string | number | undefined
}
