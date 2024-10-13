import winston,{ createLogger, format, transports } from "winston";
import AWS from "aws-sdk";
 import WinstonCloudWatch  from "winston-cloudwatch";
const {
  CLOUDWATCH_GROUP_NAME,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  NODE_ENV,
} = process.env;

// AWS.config.update({ region: AWS_REGION });


// const logger=createLogger({
//   format: format.json(),
//   transports: [
//       new (transports.Console)({
//         //  timestamp: true,
//           colorize: true,
//       })
//  ]
// });

const logger =  winston.createLogger({
  format: winston.format.json(),
  transports: [
      new (winston.transports.Console)({
          // timestamp: true,
          // colorize: true,
      })
 ]
});

const logGroup=process.env.CLOUDWATCH_GROUP_NAME||"SOTO"
 if (process.env.NODE_ENV !== 'local') {
const cloudwatchConfig = {
  logGroupName: logGroup,
  logStreamName: `${logGroup}-${process.env.NODE_ENV}`,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  messageFormatter: ({ level, message, additionalInfo }:any) =>    `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`
}
  logger.add(new WinstonCloudWatch(cloudwatchConfig))
}


export default logger





