"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.firebase = firebase_admin_1.default;
const env_config_1 = __importDefault(require("../config/env.config"));
const externalVariables = {
    FIREBASE_PROJECT_ID: env_config_1.default.FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY_ID: env_config_1.default.FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PRIVATE_KEY: (env_config_1.default.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    FIREBASE_CLIENT_EMAIL: env_config_1.default.FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID: env_config_1.default.FIREBASE_CLIENT_ID,
};
const config = {
    type: "service_account",
    project_id: externalVariables.FIREBASE_PROJECT_ID,
    private_key_id: externalVariables.FIREBASE_PRIVATE_KEY_ID,
    private_key: externalVariables.FIREBASE_PRIVATE_KEY,
    client_email: externalVariables.FIREBASE_CLIENT_EMAIL,
    client_id: externalVariables.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-oph6y%40kabukabu-375702.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
};
console.log("🚀 ~ config:", config);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(config),
    // credential: firebase.credential.cert(config as any),
});
const messaging = firebase_admin_1.default.messaging;
