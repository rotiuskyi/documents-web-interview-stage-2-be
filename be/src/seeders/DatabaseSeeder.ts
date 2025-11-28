import { Seeder } from '@mikro-orm/seeder'
import { UserFactory } from './UserFactory'
import { ActionFactory } from './ActionFactory'
import type { EntityManager } from '@mikro-orm/postgresql'
import { faker } from '@faker-js/faker'

export class DatabaseSeeder extends Seeder {
  run(em: EntityManager) {
    new UserFactory(em)
      .each((user) => {
        user.actions.set(
          new ActionFactory(em).make(
            faker.number.int({ min: 1000, max: 3000 }),
          ),
        )
      })
      .make(50)
  }
}
