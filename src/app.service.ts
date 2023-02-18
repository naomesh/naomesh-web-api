import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as process from 'process';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Minio = require('minio');

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}

  async putUploadFile(
    minioClient: any,
    bucketName: string,
    fileName: string,
    file: Express.Multer.File,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      // Uplaod file in the bucket
      minioClient.putObject(
        bucketName,
        fileName,
        file.buffer,
        (e: Error, etag: number) => {
          if (e) {
            reject('Exception while uploading file to the s3 bucket: ' + e);
          }

          resolve(etag);
        },
      );
    });
  }

  async putUploadFiles(
    bucketName: string,
    files: Array<Express.Multer.File>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Instantiate the minio client with the endpoint
      const minioClient = new Minio.Client({
        endPoint: process.env.S3_BUCKET_END_POINT,
        port: Number(process.env.S3_BUCKET_PORT),
        useSSL: false,
        accessKey: process.env.S3_BUCKET_ACCESS_KEY,
        secretKey: process.env.S3_BUCKET_SECRET_KEY,
      });

      minioClient.makeBucket(bucketName, 'eu-west-1', async (e: Error) => {
        if (e) {
          reject('Exception while creating the s3 bucket: ' + e);
        }

        await Promise.all(
          [...files.entries()].map(([i, file]) =>
            this.putUploadFile(
              minioClient,
              bucketName,
              `${i}.${file.originalname.split('.').pop()}`,
              file,
            ),
          ),
        );

        resolve(bucketName);
      });
    });
  }
}
