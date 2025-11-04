import { Factory } from '@mikro-orm/seeder'
import { UserEntity } from '../users/user.entity'
import { faker } from '@faker-js/faker'

export class UserFactory extends Factory<UserEntity> {
  model = UserEntity

  definition(): Partial<UserEntity> {
    return {
      name: faker.person.fullName(),
    }
  }
}
