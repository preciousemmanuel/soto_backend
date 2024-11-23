"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const sqs_consumer_1 = require("sqs-consumer");
aws_sdk_1.default.config.update({
    region: process.env.AWS_REGION,
});
const publishQuue = (url, data) => {
    const param = {
        MessageBody: data, // Message content
        QueueUrl: url // Replace with your queue URL
    };
    const sqs = new aws_sdk_1.default.SQS({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY });
    sqs.sendMessage(param, (err, data) => {
        if (err) {
            console.error('Error sending message:', err);
        }
        else {
            console.log('Message sent:', data.MessageId);
        }
    });
};
// const consumeQueue=(url:string)=>{
//   console.log('awscred',process.env.AWS_ACCESS_KEY,"dsd",process.env.AWS_SECRET_KEY,"reg",process.env.AWS_REGION)
//   const sqs=new AWS.SQS({accessKeyId:process.env.AWS_ACCESS_KEY,secretAccessKey:process.env.AWS_SECRET_KEY});
//   const receiveParams = {
//       QueueUrl: url, // Replace with your queue URL
//       MaxNumberOfMessages: 10 // Maximum number of messages to receive
//     };
//     sqs.receiveMessage(receiveParams, (err, data) => {
//       if (err) {
//         console.error('Error receiving messages:', err);
//       } else {
//         if (data.Messages) {
//           data.Messages.forEach(message => {
//             console.log('Received message:', message.Body);
//           });
//         } else {
//           console.log('No messages available');
//         }
//       }
//     });
// }
function createConsumer(queueUrl, handleMessage) {
    return sqs_consumer_1.Consumer.create({
        sqs: new aws_sdk_1.default.SQS({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }),
        queueUrl,
        handleMessage
    }).start();
}
;
function deleteMessage(message, queue) {
    const sqs = new aws_sdk_1.default.SQS();
    const params = {
        QueueUrl: queue,
        ReceiptHandle: message.ReceiptHandle
    };
    return sqs.deleteMessage(params).promise();
}
exports.default = { publishQuue, createConsumer, deleteMessage };
