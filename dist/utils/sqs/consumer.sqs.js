"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnConsumerCreateUserAccount = fnConsumerCreateUserAccount;
exports.fnConsumerLogUserActivity = fnConsumerLogUserActivity;
exports.fnConsumerNotification = fnConsumerNotification;
const email_message_1 = __importDefault(require("@/resources/message/email.message"));
const queue_sqs_1 = __importDefault(require("@/utils/sqs/queue.sqs"));
const url_sqs_1 = require("./url.sqs");
const user_service_1 = __importDefault(require("@/resources/user/user.service"));
const log_service_1 = __importDefault(require("@/resources/log/log.service"));
const notification_service_1 = __importDefault(require("@/resources/notification/notification.service"));
const logger_1 = __importDefault(require("@/utils/logger"));
function fnConsumerEmail(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const emailData = JSON.parse(msg.Body);
            console.log("sdsdsd", msg);
            const emailData = JSON.parse(msg.Body);
            yield (0, email_message_1.default)(emailData);
            yield queue_sqs_1.default.deleteMessage(msg, url_sqs_1.SQS_EMAIL_QUEUE);
        }
        catch (error) {
        }
    });
}
function fnConsumerNotification(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const emailData = JSON.parse(msg.Body);
            console.log("sdsdsd", msg);
            const activityData = JSON.parse(msg.Body);
            const { userId, title, content } = activityData;
            const notificationService = new notification_service_1.default();
            yield notificationService.createNotification(content, userId, title);
            yield queue_sqs_1.default.deleteMessage(msg, url_sqs_1.SQS_EMAIL_QUEUE);
        }
        catch (error) {
        }
    });
}
function fnConsumerLogUserActivity(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const emailData = JSON.parse(msg.Body);
            console.log("sdsdsd", msg);
            const activityData = JSON.parse(msg.Body);
            const { userId, activity, description } = activityData;
            const logService = new log_service_1.default();
            const created = yield logService.create(userId, activity, description);
            yield queue_sqs_1.default.deleteMessage(msg, url_sqs_1.SQS_ACTIVITY_LOG_QUEUE);
        }
        catch (error) {
        }
    });
}
function fnConsumerCreateUserAccount(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const emailData = JSON.parse(msg.Body);
            console.log("createAccountSQS", msg);
            logger_1.default.log("info", `createAccountSQS ${JSON.stringify(msg.Body)}`);
            const data = JSON.parse(msg.Body);
            logger_1.default.log("info", `parsedData- ${JSON.stringify(data)}`);
            const userData = JSON.parse(data.Message);
            logger_1.default.log("info", `parsedUSerData- ${JSON.stringify(userData)}`);
            if (Array.isArray(userData)) {
                logger_1.default.log("info", `userdaisArra`);
                for (const user of userData) {
                    const { id, name, username, email } = user;
                    const userService = new user_service_1.default();
                    const created = yield userService.createUser(id, name, username, email);
                    if (typeof created === "boolean") {
                        if (created) {
                            console.log("created user");
                        }
                        else {
                            logger_1.default.log("error", `ErorrCreatingAcont ${JSON.stringify(created)}`);
                        }
                    }
                    else {
                        logger_1.default.log("error", `ErorrCreatingAcont ${JSON.stringify(created)}`);
                    }
                }
                yield queue_sqs_1.default.deleteMessage(msg, url_sqs_1.SQS_CREATE_USER_QUEUE);
            }
            else {
                logger_1.default.log("info", `not Array`);
                const { id, name, username, email } = userData;
                console.log(id, name, username, email);
                const userService = new user_service_1.default();
                const created = yield userService.createUser(id, name, username, email);
                if (typeof created === "boolean") {
                    if (created) {
                        yield queue_sqs_1.default.deleteMessage(msg, url_sqs_1.SQS_CREATE_USER_QUEUE);
                    }
                    else {
                        logger_1.default.log("error", `ErorrCreatingAcont ${JSON.stringify(created)}`);
                    }
                }
                else {
                    logger_1.default.log("error", `ErorrCreatingAcont ${JSON.stringify(created)}`);
                }
            }
            ///   await  sendEmail(emailData);
        }
        catch (error) {
            logger_1.default.log("error", `ErorrCreatingAcont ${JSON.stringify(error)}`);
        }
    });
}
