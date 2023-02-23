import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: 'SocketService',
      useFactory: (http) => {
        const httpServer = http.getHttpServer();
        return new EventsGateway(httpServer);
      },
      inject: [HttpModule],
    },
  ],
  exports: ['SocketService'],
})
export class EventsModule {}
