import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Get()
  getHello(): string {
    //exemple de post message
    this.amqpConnection.publish('direct-exchange', 'routingKey', {
      msg: 'hello world',
    });
    return this.appService.getHello();
  }
}
