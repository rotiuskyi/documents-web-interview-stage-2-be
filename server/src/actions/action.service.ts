import { Injectable } from '@nestjs/common'
import { ActionRepository } from './action.repository'
import { GetActionsQueryDto } from './dto/get-actions-query.dto'
import { GetActionsResponseDto } from './dto/get-actions-response.dto'

@Injectable()
export class ActionService {
  constructor(private readonly actionRepository: ActionRepository) {}

  getActions(query: GetActionsQueryDto): Promise<GetActionsResponseDto> {
    return this.actionRepository.getActions(query)
  }
}
