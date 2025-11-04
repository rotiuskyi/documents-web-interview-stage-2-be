import { InjectRepository } from '@mikro-orm/nestjs'
import { Injectable } from '@nestjs/common'
import { ActionEntity } from './action.entity'
import { EntityRepository } from '@mikro-orm/postgresql'

@Injectable()
export class ActionRepository {
  constructor(
    @InjectRepository(ActionEntity)
    private readonly repository: EntityRepository<ActionEntity>,
  ) {}

  filteredActions() {
    return this.repository.findAll({ limit: 1_000 })
  }
}
