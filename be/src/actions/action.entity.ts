import {
  Entity,
  EntityDTO,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { UserEntity } from '../users/user.entity'
import { ActionType } from './action-type.enum'

@Entity({ tableName: 'actions' })
export class ActionEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number

  @ManyToOne(() => UserEntity)
  user!: UserEntity

  @Property({ type: 'text' })
  actionType!: ActionType

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date()
}

export type ActionDto = EntityDTO<ActionEntity>
