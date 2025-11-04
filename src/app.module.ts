import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import mikroOrmConfig from './mikro-orm.config'
import { ActionsModule } from 'actions/actions.module'
import { UsersModule } from 'users/users.module'
import { ReportsModule } from 'reports/reports.module'

@Module({
  imports: [
    MikroOrmModule.forRoot({ ...mikroOrmConfig, allowGlobalContext: true }),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL } }),
    UsersModule,
    ActionsModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
