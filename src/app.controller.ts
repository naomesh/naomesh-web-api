import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Param,
  Logger,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Politic, JobRequestPayload } from './app.models';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Post('upload/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(
    @Param('id') id: string,
    @Body() body: { politic: Politic },
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<void> {
    if (files.length < 1) {
      Logger.error('no files provided');
      throw new BadRequestException('no files provided');
    }

    const bucketName = await this.appService.putUploadFiles(id, files);

    const jobRequestPayload: JobRequestPayload = {
      job_id: id,
      pictures_obj_key: bucketName,
      politic: body.politic,
    };

    Logger.log(`Start job ${id} with ${files.length} files`);

    this.amqpConnection.publish(
      'jobsrequests',
      'routingKey',
      jobRequestPayload,
    );
  }
}
