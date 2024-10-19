"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.firebase = firebase_admin_1.default;
const firebase_json_1 = __importDefault(require("@/utils/firebase/firebase.json"));
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(firebase_json_1.default),
});
const messaging = firebase_admin_1.default.messaging;
