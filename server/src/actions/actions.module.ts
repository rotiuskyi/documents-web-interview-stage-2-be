import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ActionEntity } from './action.entity'
import { ActionRepository } from './action.repository'
import { ActionService } from './action.service'
import { ActionController } from './action.controller'

@Module({
  imports: [MikroOrmModule.forFeature([ActionEntity])],
  providers: [ActionRepository, ActionService],
  controllers: [ActionController],
  exports: [ActionRepository, ActionService],
})
export class ActionsModule {}
