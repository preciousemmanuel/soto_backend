import firebase from "firebase-admin";
import fs from 'fs';
import path from 'path';
import serviceAccount from "@/utils/firebase/firebase.json";
import envConfig from "../config/env.config";

const externalVariables = {
  FIREBASE_PROJECT_ID: envConfig.FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY_ID: envConfig.FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY: (envConfig.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
  FIREBASE_CLIENT_EMAIL: envConfig.FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID: envConfig.FIREBASE_CLIENT_ID,
}

const config: any = {
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
}
console.log("🚀 ~ config:", config)


firebase.initializeApp({
    credential: firebase.credential.cert(config),
    // credential: firebase.credential.cert(config as any),
 
  });

  const messaging=firebase.messaging


  export {firebase}