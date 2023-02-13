import { Injectable } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  @RabbitRPC({
    exchange: 'direct-exchange',
    routingKey: 'routingKey',
    queue: 'rpc-queue',
  })
  public async rpcHandler(msg: any) {
    console.log('rpcHandler', msg);
    return {
      response: 42,
    };
  }
}
