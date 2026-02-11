import { Types } from 'mongoose';
import config from '../config';
import { BadRequestError } from '../errors/bad-request.error';
import { s3 } from '../utils/s3.util';

class UploadService {
  constructor(private readonly _s3 = s3) { }

  async uploadToS3(file: Express.Multer.File, bucketName: string, fileName?: string) {
    const buffer = file.buffer;
    const mimetype = file.mimetype;
    const originalName = file.originalname;
    const splittedName = originalName.split('.');
    const ext = splittedName[splittedName.length - 1];

    if (!buffer) throw new BadRequestError('No image buffer provided');
    if (!mimetype) throw new BadRequestError('Invalid or unsupported mimetype');

    fileName = fileName || String(new Types.ObjectId());
    const fileNameWithExtn = `${fileName}.${ext}`;

    const params = {
      Bucket: config.S3_BUCKET_NAME,
      Key: `${bucketName}/${fileNameWithExtn}`,
      Body: buffer,
      ContentType: mimetype
    };

    const response = await this._s3.upload(params).promise();
    if (!response) throw new BadRequestError('Failed to upload file');

    return {
      fileName: fileNameWithExtn
    };
  }

}

export default new UploadService();