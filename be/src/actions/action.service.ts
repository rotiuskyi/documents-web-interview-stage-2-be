import { Injectable } from '@nestjs/common'
import { ActionRepository } from './action.repository'

@Injectable()
export class ActionService {
  constructor(private readonly actionRepository: ActionRepository) {}

  getFilteredActions() {
    return this.actionRepository.filteredActions()
  }
}
