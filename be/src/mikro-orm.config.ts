import 'dotenv/config'

import { Migrator } from '@mikro-orm/migrations'
import { defineConfig } from '@mikro-orm/postgresql'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'
import { SeedManager } from '@mikro-orm/seeder'
import { SqlHighlighter } from '@mikro-orm/sql-highlighter'
import { UserEntity } from './users/user.entity'
import { ActionEntity } from './actions/action.entity'

export default defineConfig({
  strict: true,
  entities: [UserEntity, ActionEntity],
  clientUrl: process.env.DATABASE_URL,
  debug: ['query', 'query-params'],
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator, SeedManager],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  seeder: {
    path: 'dist/seeders',
    pathTs: 'src/seeders',
  },
  schemaGenerator: {
    disableForeignKeys: false,
    createForeignKeyConstraints: true,
  },
  highlighter: new SqlHighlighter(),
  colors: true,
})
