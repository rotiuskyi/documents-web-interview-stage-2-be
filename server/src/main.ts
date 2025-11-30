import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

const setupSwagger = (app: NestExpressApplication) => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Action API')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('documentation', app, document)
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  setupSwagger(app)

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch((error: unknown) => {
  console.error(error)
})
