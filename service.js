const Minio = require('minio');

class AppService {
    /**
     * Async wrapper to upload some files in a bucket
     * @param minioClient
     * @param bucketName
     * @param fileName
     * @param file
     * @returns
     */
    async putUploadFile(
      minioClient,
      bucketName,
      fileName,
      file,
    ){
      return new Promise((resolve, reject) => {
        minioClient.putObject(
          bucketName,
          fileName,
          file.buffer,
          (e, etagr) => {
            if (e) {
              reject('Exception while uploading file to the s3 bucket: ' + e);
            }
  
            resolve(etagr);
          },
        );
      });
    }
  
    /**
     * Async wrapper to check if a bucket currently exists
     * @param minioClient
     * @param bucketName
     * @returns
     */
    async checkBucketExists(
      minioClient,
      bucketName,
    ) {
      return new Promise((resolve, reject) => {
        minioClient.bucketExists(bucketName, (e, exists) => {
          if (e) {
            reject('Exception while checking the s3 bucket: ' + e);
          }
  
          resolve(exists);
        });
      });
    }
  
    /**
     * Async wrapper to create a new bucket
     * @param minioClient Async wrapper to instanciate a new bucket
     * @param bucketName
     * @returns
     */
    async createBucket(minioClient, bucketName) {
      return new Promise((resolve, reject) => {
        minioClient.makeBucket(bucketName, 'eu-west-1', async (e) => {
          if (e) {
            reject('Exception while creating the s3 bucket: ' + e);
          }
  
          resolve();
        });
      });
    }
  
    /**
     * Async wrapper to get an object in a specific bucket
     * @param minioClient
     * @param bucketName
     * @param path
     * @returns
     */
    async getObject(
      minioClient,
      bucketName,
      path,
    ) {
      return new Promise((resolve, reject) => {
        try {
          let data = '';
          minioClient.getObject(bucketName, path, (e, stream) => {
            if (e) {
              reject('Exception while fetching datas from the s3 bucket: ' + e);
            }
  
            stream.on('data', (chunck) => {
              data += chunck;
            });
  
            stream.on('end', () => {
              resolve(data);
            });
          });
        } catch (e) {
          reject('Exception while getting object from the s3 bucket: ' + e);
        }
      });
    }
  
    /**
     * Check if the bucket is available and store files in the correct task folder.
     * For instance, store 5 images in naomesh/job[uuid]/uploads/
     * @param taskId
     * @param files
     * @returns the path of the files for the task launch (/{job_id}/uploads)
     */
    async uploadTaskFiles(
      taskId,
      files,
    ) {
      return new Promise(async (resolve, reject) => {
        // Instantiate the minio client with the endpoint
        const minioClient = new Minio.Client({
          endPoint: process.env.S3_BUCKET_END_POINT,
          port: Number(process.env.S3_BUCKET_PORT),
          useSSL: false,
          accessKey: process.env.S3_BUCKET_ACCESS_KEY,
          secretKey: process.env.S3_BUCKET_SECRET_KEY,
        });
  
        try {
          const bucketName = 'naomesh';
  
          // check if the naomesh bucket currently exists
          const exists = await this.checkBucketExists(minioClient, bucketName);
  
          if (!exists) {
            // If the bucket don't exist yet, we need to create it
            await this.createBucket(minioClient, bucketName);
          }
  
          // The, we upload each file in the corresponding task folder
          await Promise.all(
            [...files.entries()].map(([i, file]) =>
              this.putUploadFile(
                minioClient,
                bucketName,
                `job${taskId}/uploads/${i}.${file.originalname.split('.').pop()}`,
                file,
              ),
            ),
          );
  
          resolve(`job${taskId}/uploads/`);
        } catch (e) {
          reject(e);
        }
      });
    }
  
    async getTaskFiles(
      taskId,
    ){
      return new Promise(async (resolve, reject) => {
        // Instantiate the minio client with the endpoint
        const minioClient = new Minio.Client({
          endPoint: process.env.S3_BUCKET_END_POINT,
          port: Number(process.env.S3_BUCKET_PORT),
          useSSL: false,
          accessKey: process.env.S3_BUCKET_ACCESS_KEY,
          secretKey: process.env.S3_BUCKET_SECRET_KEY,
        });
  
        try {
          const scene = await this.getObject(
            minioClient,
            'naomesh',
            `job${taskId}/results/scene_dense_mesh_texture.ply`,
          );
  
          const texture = await this.getObject(
            minioClient,
            'naomesh',
            `job${taskId}/results/scene_dense_mesh_texture.png`,
          );
  
          resolve({ scene, texture });
        } catch (e) {
          reject(e);
        }
      });
    }
  }
  

  module.exports = AppService;