import AWS from 'aws-sdk';
import config from '../config';

export const ses = new AWS.SES({
  credentials: {
    accessKeyId: config.AWS_ACCESS_ID,
    secretAccessKey: config.AWS_SECRET,
  },
  region: config.AWS_REGION
});