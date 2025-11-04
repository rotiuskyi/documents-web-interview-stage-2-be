import {
  Collection,
  Entity,
  EntityDTO,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { ActionEntity } from '../actions/action.entity'

@Entity({ tableName: 'users' })
export class UserEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number

  @Property({ type: 'text' })
  name!: string

  @OneToMany({ entity: () => ActionEntity, mappedBy: 'user' })
  actions = new Collection<ActionEntity>(this)
}

export type UserDto = EntityDTO<UserEntity>
