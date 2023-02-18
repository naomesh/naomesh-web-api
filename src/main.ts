import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Naomesh Frontend NestJS API')
    .setDescription('Specification')
    .setVersion('1.0')
    .setContact(
      'API Support',
      'lucas.rouretperso@gmail.com',
      'https://github.com/naomesh',
    )
    .setLicense('Apache 2.0', 'http://www.apache.org/licenses/LICENSE-2.0.html')
    .addTag('node', 'everything related to node')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
