/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
dotenv.config();

const config = {
  MONGO_URI: process.env.MONGO_URI! as string,
  NODE_ENV: process.env.NODE_ENV! as string,
  REDIS_HOST: process.env.REDIS_HOST! as string,
  REDIS_PORT: process.env.REDIS_PORT! as string,
  REDIS_USERNAME: process.env.REDIS_USERNAME! as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD! as string,
  PORT: process.env.PORT! as string,
  JWT_SECRET: process.env.JWT_SECRET! as string,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY! as string,
  CLOUDWATCH_LOG_GROUP_NAME: process.env.CLOUDWATCH_LOG_GROUP_NAME! as string,
  CLOUDWATCH_LOGS_ID: process.env.CLOUDWATCH_LOGS_ID! as string,
  CLOUDWATCH_LOGS_SECRET: process.env.CLOUDWATCH_LOGS_SECRET! as string,
  CLOUDWATCH_LOGS_REGION: process.env.CLOUDWATCH_LOGS_REGION! as string,

  SERVER_NAME: `${process.env.SERVER_NAME}-${process.env.NODE_ENV}`! as string,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME! as string,
  AWS_ACCESS_ID: process.env.AWS_ACCESS_ID! as string,
  AWS_SECRET: process.env.AWS_SECRET! as string,
  AWS_REGION: process.env.AWS_REGION! as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID! as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET! as string,
  NOTIFY_TO: process.env.NOTIFY_TO! as string,
  JWT_CACHE_ENCRYPTION_KEY: process.env.JWT_CACHE_ENCRYPTION_KEY! as string,
  GMAIL_USER: process.env.GMAIL_USER! as string,
  GMAIL_PASSWORD: process.env.GMAIL_PASSWORD! as string,
  DEFAULT_COUNTRY_CODE: 'IN',
};

export default config;
