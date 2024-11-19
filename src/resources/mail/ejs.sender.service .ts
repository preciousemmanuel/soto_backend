import UserModel from "@/resources/user/user.model";
import nodemailer from "nodemailer"
import {
  MailSendingOptions,
  StatusMessages,
  UserTypes
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import { sendEmailPayload } from "./mail.interface";
import envConfig from "@/utils/config/env.config";
import sgMail from '@sendgrid/mail';

class EmailSenderService {
  private User = UserModel


  public async sendEmailEJS(payload: sendEmailPayload): Promise<ResponseData> {
    let info: any
    let responseData: ResponseData = {
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: "Unable To Send Mail At The Moment"
    }
    let transporter: any
    let carbonCopy: any
    try {
      const {
        email,
        subject,
        html,
        cc,
        attachments
      } = payload
      switch (envConfig.MAIL_SENDER) {
        case MailSendingOptions.SENDGRID:
          carbonCopy = cc ? cc.split(",") : undefined
          break;
        default:
          carbonCopy = cc ? cc : undefined
          break;
      }

      const message = {
        from: "Hello@soto.com",
        to: email,
        subject: subject,
        html: html,
        ...(cc && { cc: carbonCopy }),
        // ...((attachments && attachments.length > 0) && { attachments })
      }

      switch (envConfig.MAIL_SENDER) {
        case MailSendingOptions.GMAIL:
          console.log("🚀 ~ EmailSenderService ~ sendEmailEJS ~ MailSendingOptions.GMAIL:", MailSendingOptions.GMAIL)
          transporter = nodemailer.createTransport({
            host: envConfig.MAIL_HOST,
            service: "Gmail",
            auth: {
              user: envConfig.MAIL_AUTH_USER,
              pass: envConfig.MAIL_AUTH_PASS
            }
          })
          info = await transporter.sendMail(message)
          if (!info) {
            responseData = {
              status: StatusMessages.error,
              code: HttpCodes.HTTP_BAD_REQUEST,
              message: "Unable To Send Mail At The Moment"
            }
          } else {
            responseData = {
              status: StatusMessages.success,
              code: HttpCodes.HTTP_OK,
              message: `Successfully sent mail to: ${email}`
            }
          }
          break;
        case MailSendingOptions.SENDGRID:
          console.log("🚀 ~ EmailSender ~ sendEmailEJS ~ MailSendingOptions.SENDGRID:", MailSendingOptions.SENDGRID)
          sgMail.send(message)
            .then((resp) => {
              console.log("🚀 ~ emailSender ~ .then ~ resp:", resp[0].toString())
              responseData = {
                status: StatusMessages.success,
                code: HttpCodes.HTTP_OK,
                message: `Successfully sent mail to: ${email}`
              }
            })
            .catch((e: any) => {
              console.log("🚀 ~ emailSender ~ sendEmailEJS ~ e:", e)
              responseData = {
                status: StatusMessages.error,
                code: HttpCodes.HTTP_BAD_REQUEST,
                message: e.toString()
              }
            })
          break;
        case MailSendingOptions.BREVO:
          console.log("🚀 ~ EmailSender ~ sendEmailEJS ~ MailSendingOptions.BREVO:", MailSendingOptions.BREVO)
          transporter = nodemailer.createTransport({
            host: envConfig.BREVO_MAIL_HOST,
            port: Number(envConfig.BREVO_MAIL_PORT),
            auth: {
              user: envConfig.BREVO_USERNAME,
              pass: envConfig.BREVO_MAIL_PASSWORD
            }
          })
          info = await transporter.sendMail(message)
          console.log("🚀 ~ EmailSender ~ sendEmailEJS ~ info:", info)
          if (!info) {
            responseData = {
              status: StatusMessages.error,
              code: HttpCodes.HTTP_BAD_REQUEST,
              message: "Unable To Send Mail At The Moment"
            }
          } else {
            responseData = {
              status: StatusMessages.success,
              code: HttpCodes.HTTP_OK,
              message: `Successfully sent mail to: ${email}`
            }
          }
          break;
        default:
          responseData = {
            status: StatusMessages.error,
            code: HttpCodes.HTTP_BAD_REQUEST,
            message: "Unable To Send Mail At The Moment"
          }
          break;
      }

      return responseData


    } catch (error: any) {
      console.log("🚀 ~ EmailSenderService ~ sendEmailEJS ~ error:", error)
      return responseData
    }
  }


}

export default EmailSenderService;