import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Param,
  Logger,
  BadRequestException,
  Body,
  Get,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Politic, JobRequestPayload, JobResult } from './app.models';
import { Client } from 'pg';
import * as process from 'process';

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
    @Body() body: Politic,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<void> {
    if (files.length < 1) {
      Logger.error('no files provided');
      throw new BadRequestException('no files provided');
    }

    const bucketName = await this.appService.uploadTaskFiles(id, files);

    const jobRequestPayload: JobRequestPayload = {
      job_id: id,
      pictures_obj_key: bucketName,
      politic: {
        quality: body.quality,
        energy: body.energy,
      },
    };

    Logger.log(`Start job ${id} with ${files.length} files`);

    this.amqpConnection.publish(
      'jobsrequests',
      'routingKey',
      jobRequestPayload,
    );
  }

  @Get('/results')
  async getResults(): Promise<JobResult[]> {
    const client = new Client({
      host: String(process.env.DB_HOST),
      port: Number(process.env.DB_PORT),
      user: String(process.env.DB_USERNAME),
      password: String(process.env.DB_PASSWORD),
      database: String(process.env.DB_NAME),
    });

    client.connect();
    const results: JobResult[] = [];

    try {
      const response = await client.query('SELECT * FROM results');
      for (const row of response.rows) {
        results.push(row as JobResult);
      }
    } catch (e) {
      Logger.error(`the request failed with the following exception:\n ${e}`);
      throw new InternalServerErrorException(e);
    }

    client.end();

    return results;
  }

  @Get('/results/:id')
  async getResultData(@Param('id') id: string) {
    // get the scene and texture datas from the bucket
    const datas = await this.appService.getTaskFiles(id);

    return datas;
  }
}
