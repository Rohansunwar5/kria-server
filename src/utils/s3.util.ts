import AWS from 'aws-sdk';
import config from '../config';

export const s3 = new AWS.S3({
  credentials: {
    accessKeyId: config.AWS_ACCESS_ID,
    secretAccessKey: config.AWS_SECRET,
  },
  region: config.AWS_REGION
});