import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
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

  @WebSocketServer()
  server: IoServer;

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
    this.logger.log(`Received message from topic [${topic}]`);
    for (const [id, client] of Object.entries(this.clients)) {
      this.logger.log(`Emitted event to '${id}' on the topic '${topic}'`);
      client.emit(topic, cb());
    }
  }

  @RabbitRPC({
    exchange: 'amq.direct',
    routingKey: 'orchestration.jobs.status',
    queue: 'jobsstatus',
  })
  public async jobsStatusHandler(msg: JobStatusPayload) {
    this.emitValuesForAll('jobsstatus', () => {
      return msg;
    });
  }

  @RabbitRPC({
    exchange: 'amq.direct',
    routingKey: 'orchestration.jobs.finished',
    queue: 'jobsfinished',
  })
  public async jobsFinishedHandler(msg: JobFinishedPayload) {
    this.emitValuesForAll('jobsfinished', () => {
      return msg;
    });
  }

  @RabbitRPC({
    exchange: 'amq.topic',
    routingKey: 'orchestration.currentallocatednodes',
    queue: 'allocatednodes',
  })
  public async allocatedNodesHandler(msg: AllocatedNodesPayload) {
    this.emitValuesForAll('allocatednodes', () => {
      return msg;
    });
  }
}
