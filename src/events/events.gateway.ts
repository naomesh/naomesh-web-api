import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

@WebSocketGateway(4001, { transport: ['websocket'] })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;
  clients: { [client_id: string]: any } = {};

  private logger = new Logger('AppGateway');

  emitValuesForAll(cb) {
    for (const [id, client] of Object.entries(this.clients)) {
      client.emit(cb());
    }
  }

  @RabbitRPC({
    exchange: 'direct-exchange',
    routingKey: 'routingKey',
    queue: 'rpc-queue',
    queueOptions: {
      channel: 'jobsstatus',
    },
  })
  public async jobsStatusHandler(msg: any) {
    console.log('jobsStatusHandler', msg);
    this.emitValuesForAll(() => {
      return msg;
    });
  }

  @RabbitRPC({
    exchange: 'direct-exchange',
    routingKey: 'routingKey',
    queue: 'rpc-queue',
    queueOptions: {
      channel: 'jobsfinished',
    },
  })
  public async jobsFinishedHandler(msg: any) {
    console.log('jobsFinishedHandler', msg);
    this.emitValuesForAll(() => {
      return msg;
    });
  }

  @RabbitRPC({
    exchange: 'direct-exchange',
    routingKey: 'routingKey',
    queue: 'rpc-queue',
    queueOptions: {
      channel: 'allocatednodes',
    },
  })
  public async allocatedNodesHandler(msg: any) {
    console.log('allocatedNodesHandler', msg);
    this.emitValuesForAll(() => {
      return msg;
    });
  }
  handleConnection(client) {
    this.logger.log('New client connected');
    this.clients[client.id] = client;

    client.emit('connection', 'Successfully connected to server');
  }

  handleDisconnect(client) {
    delete this.clients[client.id];
    this.logger.log('Client disconnected');
  }
}
