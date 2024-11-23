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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotification = void 0;
const index_firebase_1 = require("./index.firebase");
const pushNotification = (msg_1, fcmToken_1, ...args_1) => __awaiter(void 0, [msg_1, fcmToken_1, ...args_1], void 0, function* (msg, fcmToken, title = "", imageUrl = "https://trybe-one-dev.s3.af-south-1.amazonaws.com/Avatar+-+Man.png") {
    console.log("msg: ", msg, "fcm", fcmToken);
    try {
        const response = yield index_firebase_1.firebase.messaging().send({
            token: fcmToken,
            data: {
                title,
                body: JSON.stringify(msg),
                imageUrl,
                alert: "",
            },
            android: {
                priority: "high",
                ttl: 0,
            },
            // Add APNS (Apple) config
            apns: {
                payload: {
                    aps: {
                        contentAvailable: true,
                    },
                },
                headers: {
                    "apns-push-type": "background",
                    "apns-priority": "5", // Must be `5` when `contentAvailable` is set to true.
                    "apns-topic": "io.flutter.plugins.firebase.messaging", // bundle identifier
                },
            },
        });
        console.log("responsePush", response);
        return true;
    }
    catch (error) {
        console.log("error", error);
        return false;
    }
});
exports.pushNotification = pushNotification;
