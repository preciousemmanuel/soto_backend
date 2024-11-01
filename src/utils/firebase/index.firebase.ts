import firebase from "firebase-admin";

import serviceAccount from "@/utils/firebase/firebase.json";


firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount as any),
 
  });

  const messaging=firebase.messaging


  export {firebase}