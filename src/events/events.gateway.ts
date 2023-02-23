import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import {
  JobStatusPayload,
  JobFinishedPayload,
  AllocatedNodesPayload,
} from '../app.models';

@WebSocketGateway(4000, { transports: ['websocket'] })
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  afterInit(server: any) {
    this.logger.log('WebSocketGateway Initialized');
  }

  @WebSocketServer()
  server: Server;

  private logger = new Logger('AppGateway');

  handleConnection(client) {
    this.logger.log('New client connected');
  }

  handleDisconnect(client) {
    this.logger.log('Client disconnected');
  }

  emitValuesForAll(topic, cb) {
    this.logger.log(`Emitted event on the topic '${topic}'`);
    this.server.emit(topic, cb());
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
