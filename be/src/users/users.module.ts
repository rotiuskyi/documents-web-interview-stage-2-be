import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { UserEntity } from './user.entity'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity])],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UsersModule {}
