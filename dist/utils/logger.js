"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_cloudwatch_1 = __importDefault(require("winston-cloudwatch"));
const { CLOUDWATCH_GROUP_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, NODE_ENV, } = process.env;
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
const logger = winston_1.default.createLogger({
    format: winston_1.default.format.json(),
    transports: [
        new (winston_1.default.transports.Console)({
        // timestamp: true,
        // colorize: true,
        })
    ]
});
const logGroup = process.env.CLOUDWATCH_GROUP_NAME || "SOTO";
if (process.env.NODE_ENV !== 'local') {
    const cloudwatchConfig = {
        logGroupName: logGroup,
        logStreamName: `${logGroup}-${process.env.NODE_ENV}`,
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
        awsRegion: process.env.AWS_REGION,
        messageFormatter: ({ level, message, additionalInfo }) => `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`
    };
    logger.add(new winston_cloudwatch_1.default(cloudwatchConfig));
}
exports.default = logger;
