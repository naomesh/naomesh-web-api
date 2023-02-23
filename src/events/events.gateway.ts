import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server as IoServer } from 'socket.io';
import { Server as HttpServer } from 'http';

import {
  JobStatusPayload,
  JobFinishedPayload,
  AllocatedNodesPayload,
} from '../app.models';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  protected ioServer: IoServer;
  clients: { [client_id: string]: any } = {};

  constructor(protected httpServer: HttpServer) {
    this.ioServer = new IoServer(httpServer);
  }

  private logger = new Logger('AppGateway');

  handleConnection(client) {
    this.logger.log('New client connected');
    this.clients[client.id] = client;

    client.emit('connection', 'Successfully connected to server');
  }

  handleDisconnect(client) {
    delete this.clients[client.id];
    this.logger.log('Client disconnected');
  }

  emitValuesForAll(topic, cb) {
    for (const [id, client] of Object.entries(this.clients)) {
      this.logger.log(`Emitted event to '${id}' on the topic '${topic}'`);
      client.emit(topic, cb());
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
  public async jobsStatusHandler(msg: JobStatusPayload) {
    console.log('jobsStatusHandler', msg);
    this.emitValuesForAll('jobsstatus', () => {
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
  public async jobsFinishedHandler(msg: JobFinishedPayload) {
    console.log('jobsFinishedHandler', msg);
    this.emitValuesForAll('jobsfinished', () => {
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
  public async allocatedNodesHandler(msg: AllocatedNodesPayload) {
    console.log('allocatedNodesHandler', msg);
    this.emitValuesForAll('allocatednodes', () => {
      return msg;
    });
  }
}
