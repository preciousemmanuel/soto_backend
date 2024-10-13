import { firebase } from "./index.firebase";

 



const pushNotification = async (
    msg:any,
    fcmToken:string,
    title = "",
    imageUrl = "https://trybe-one-dev.s3.af-south-1.amazonaws.com/Avatar+-+Man.png"
  ) => {
    console.log("msg: ", msg, "fcm", fcmToken);
    try {
      const response = await  firebase.messaging().send ({
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
    } catch (error) {
      console.log("error", error);
      return false;
    }
  };

  export {pushNotification}