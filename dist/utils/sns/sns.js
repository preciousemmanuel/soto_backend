"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({
    region: process.env.AWS_REGION,
});
const publishSns = (data, topic, phone) => {
    const sns = new aws_sdk_1.default.SNS({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    let params = {
        Message: data,
    };
    if (phone) {
        params["PhoneNumber"] = phone;
    }
    else {
        params.TopicArn = topic;
    }
    console.log("sdsadda", params);
    sns.publish(params, (err, data) => {
        if (err) {
            console.error('Error sending message:', err);
        }
        else {
            console.log('Message sent:', data.MessageId);
        }
    });
};
function createSnsConsumer(protocol = "sqs", topicArn, queueUrl) {
    const sns = new aws_sdk_1.default.SNS({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    const subscribeParams = {
        Protocol: 'sqs',
        TopicArn: topicArn,
        Endpoint: queueUrl
    };
    sns.subscribe(subscribeParams, (err, data) => {
        if (err) {
            console.error('Error subscribing SQS queue to SNS topic:', err);
        }
        else {
            console.log('SQS queue subscribed to SNS topic');
        }
    });
}
;
exports.default = { publishSns, createSnsConsumer };
