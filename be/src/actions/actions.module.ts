import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ActionEntity } from './action.entity'
import { ActionRepository } from './action.repository'
import { ActionService } from './action.service'

@Module({
  imports: [MikroOrmModule.forFeature([ActionEntity])],
  providers: [ActionRepository, ActionService],
  exports: [ActionService],
})
export class ActionsModule {}
