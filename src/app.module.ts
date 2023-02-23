import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { HttpModule } from '@nestjs/axios';
import * as process from 'process';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
    }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'direct-exchange',
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL,
      enableControllerDiscovery: true,
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsModule],
})
export class AppModule {}
