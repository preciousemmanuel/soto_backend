import UserModel from "@/resources/user/user.model";
import {
  CreateNotificationDto,
  OneSignalPushNotificationDto,
  FirebasePushNotificationDto,
  FetchNotificationsDto,
  AddFcmTokenOrPlayerIdDto
} from "./notification.dto";
import { NotificationTypes, OtpPurposeOptions, ReadAndUnread, StatusMessages, YesOrNo } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import mongoose from "mongoose";
import notificationModel from "./notification.model";
import * as OneSignal from 'onesignal-node'
import envConfig from "@/utils/config/env.config";
import { pushNotification } from "@/utils/firebase/message.firebase";

class NotificationService {
  private User = UserModel;
  private Notification = notificationModel;

  public async addFcmTokenOrPlayerId(
   payload: AddFcmTokenOrPlayerIdDto
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
      status: StatusMessages.success,
      code: HttpCodes.HTTP_OK,
      message: "PlayerId or FcmToken Updated Successfully",
    }
    try {
      const {
        user_id,
        fcmToken,
        playerId
      } = payload
      const user = await this.User.findById(user_id)
      
      if(!user) {
        return {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "User Not Found",
        }
      }

      if(!fcmToken && !playerId) {
        return {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Nothing To Update",
        }
      }

      const update = {
        ...(fcmToken && {fcmToken}),
        ...(playerId && {playerId}),
      }
      const updatedUser = await this.User.findByIdAndUpdate(user_id, update, {new: true})
      responseData.data = updatedUser

      return responseData
    } catch (error: any) {
      console.log("🚀 ~ NotificationService addFcmTokenOrPlayerId~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }


  public async createNotification(
    payload: CreateNotificationDto,
  ): Promise<ResponseData> {
    console.log("NOTIFICATION CREATE INITIATED");
    let responseData: ResponseData = {
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: "Unable To Send Notification At The Moment",
    }
    const  sender_id = payload?.sender ? payload.sender : "6731c8ec1302e8d39132c289"
    try {
      const notification = await this.Notification.create({
        sender: sender_id,
        receiver: payload.receiver,
        type: payload.type,
        content: payload.content,
        title: payload.title
      })
      const user = await this.User.findById(payload.receiver)
      let imageUrl = "";
      let name = "";
      return  responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Notification Created Successfully",
          data: notification
        }
      // if(user){
      //   const fcmToken = user.fcmToken
      //   const playerId = user.playerId
      //   const sender = await this.User.findById(sender_id)
      //   imageUrl = payload?.image || sender?.ProfileImage || ""
      //   name = payload?.type === NotificationTypes.MESSAGE ? sender?.Email ? sender.Email : "SOTO":"SOTO"
      //   if(playerId) {
      //     const oneSignalPayload: OneSignalPushNotificationDto = {
      //       message: {
      //         ...notification.toObject(),
      //         name,
      //         imageUrl
      //       },
      //       playerId,
      //       heading: "Soto",
      //       imageUrl
      //     }
      //     responseData = await this.oneSignalPushNotification(oneSignalPayload)
      //   } else if(fcmToken) {
      //      const firebasePayload: FirebasePushNotificationDto = {
      //       message: {
      //         ...notification.toObject(),
      //         name,
      //         imageUrl
      //       },
      //       fcmToken,
      //       heading: "Soto",
      //       imageUrl
      //     }
      //     responseData = await this.firebasePushNotification(firebasePayload)
      //   }
      // } else {
      //   responseData = {
      //     status: StatusMessages.error,
      //     code: HttpCodes.HTTP_BAD_REQUEST,
      //     message: "Unable To Send Notification At The Moment",
      //   }
      // }
      
      // return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async oneSignalPushNotification(
    payload: OneSignalPushNotificationDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Notification Sent Successfully",
        }
    try {
      const {
        message,
        playerId,
        heading = "Soto",
        imageUrl = ""
      } = payload
      const client = new OneSignal.Client(
        envConfig.ONE_SIGNAL_APPID,
        envConfig.ONE_SIGNAL_APIKEY,
      )

      const notification = {
        heading: {
          en: heading,
        },
         large_icon: imageUrl,

        include_aliases: {
          external_id: [playerId],
        },
        included_segments: [playerId],
        include_player_ids: [playerId],
        target_channel: "push",
        content_available: true,
        data: message,
        contents: {
          en: message.content,
        },
        name: message.content,
      }
      await client.createNotification(notification)
      .then((oneSignalPush) => {
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Notification Sent Successfully",
          data: oneSignalPush.body
        }
      })
      .catch((err) => {
        console.log("🚀 ~ await client.createNotification(notification) ~ err:", err)
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: err.toString(),
          data: err
        }
      })

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ NotificationService oneSignalPushNotification~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async firebasePushNotification(
    payload: FirebasePushNotificationDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Notification Sent Successfully",
        }
    try {
      const {
        message,
        fcmToken,
        heading = "Soto",
        imageUrl = ""
      } = payload
      // const sendNotification = await pushNotification(
      //   message,
      //   fcmToken,
      //   heading,
      //   imageUrl
      // )
      // if (sendNotification === true){
      //   return responseData
      // } else {
      //   return {
      //     status: StatusMessages.error,
      //     code: HttpCodes.HTTP_BAD_REQUEST,
      //     message: "Unable To Send Notification At The Moment",
      //   }
      // }
     return responseData
    } catch (error: any) {
      console.log("🚀 ~ NotificationService firebasePushNotification~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async fetchNotifications(
    payload: FetchNotificationsDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
      status: StatusMessages.success,
      code: HttpCodes.HTTP_OK,
      message: "Notifications Fetched Successfully",
    }
    try {
      const {
        user,
        type,
        search,
        limit,
        page
      } = payload
      const is_read = type ? type === ReadAndUnread.UNREAD ? false : true : false
      const filter = {
        $and:[
          { ...(search && {
              $or:[
                {title: {$regex: search, $options:"i"}},
                {content: {$regex: search, $options:"i"}}
              ]
            })
          },
          {
            receiver: user._id
          },
          {
            is_read
          }
        ]
      }
      const notificationsRecords = await getPaginatedRecords(this.Notification, {
        limit,
        page,
        data: filter
      })
      responseData.data = notificationsRecords
      return responseData
     
    } catch (error: any) {
      console.log("🚀 ~ NotificationService fetchNotifications~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async markNotificationAsRead(
   user: InstanceType<typeof this.User>,
   notification_id: string
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
      status: StatusMessages.success,
      code: HttpCodes.HTTP_OK,
      message: "Notifications Marked As Read Successfully",
    }
    try {
      const notifcation = await this.Notification.findOne({
        _id: notification_id,
        receiver: user._id
      })
      if(!notifcation) {
        return {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Notifications Not Found",
        }
      }
      const markedAsRead = await this.Notification.findByIdAndUpdate(notification_id, {
        is_read: true
      }, {new: true})
      responseData.data = markedAsRead
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ NotificationService markNotificationAsRead~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }



}

export default NotificationService;