import { Factory } from '@mikro-orm/seeder'
import { faker } from '@faker-js/faker'
import { ActionEntity } from '../actions/action.entity'
import { ActionType } from '../actions/action-type.enum'

const meta = () => [
  { ip: faker.internet.ipv4(), sign: faker.person.zodiacSign() },
  { color: faker.color.human(), dish: faker.food.dish() },
  { city: faker.location.city(), country: faker.location.country() },
  { company: faker.company.name(), jobTitle: faker.person.jobTitle() },
  { product: faker.commerce.productName(), price: faker.commerce.price() },
]

export class ActionFactory extends Factory<ActionEntity> {
  model = ActionEntity

  definition(): Partial<ActionEntity> {
    return {
      actionType: faker.helpers.enumValue(ActionType),
      createdAt: faker.date.past(),
      metadata: faker.helpers.arrayElement(meta()),
    }
  }
}
