import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'direct-exchange',
          type: 'topic',
        },
      ],
      uri: 'amqp://naomesh:naomesh@localhost:5672',
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
