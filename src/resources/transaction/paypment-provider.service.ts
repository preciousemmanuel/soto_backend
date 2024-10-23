import UserModel from "@/resources/user/user.model";
import { axiosRequestFunction, convertNairaToKobo } from "@/utils/helpers";

// import logger from "@/utils/logger";
import {
  FullPaymentLinkDto,
} from "./transaction.dto";
import { hashPassword } from "@/utils/helpers/token";
import { StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import TransactionLogModel from "./transactionLog.model";
import orderModel from "../order/order.model";
import envConfig from "@/utils/config/env.config";
import { requestProp } from "../mail/mail.interface";

class PaymentProviderService {
  private TransactionLog = TransactionLogModel;
  private User = UserModel
  private Order = orderModel

  public async paystackPaymentLink(
    payload: FullPaymentLinkDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const paystackPayload = {
        amount: convertNairaToKobo(payload.amount),
        email: payload.user.Email,
        currency: "NGN",
        reference: payload.txnRef,
        callback_url: envConfig.PAYSTACK_CALLBACK_URL,
        metadata: {
          customer_id: payload.user.id,
          narration: payload.narration,
          narration_id: payload.narration_id,
          name: payload.user.FirstName + " " + payload.user.LastName,
          email: payload.user.Email,
          phone_number: payload.user.PhoneNumber,
        }
      }

      const axiosConfig: requestProp = {
        url: envConfig.PAYSTACK_BASE_URL + '/transaction/initialize',
        method: "POST",
        body: paystackPayload,
        headers: {
          authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY
        }
      }
      const initializeTransaction = await axiosRequestFunction(axiosConfig)
      if ((Number(initializeTransaction?.status) < 400) && (initializeTransaction?.data)) {
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Link Generated Succcessfully",
          data: {
            link: initializeTransaction?.data?.authorization_url,
            txRef: initializeTransaction?.data?.reference,
          }
        }
        return responseData
      } else {
        return initializeTransaction
      }

    } catch (error: any) {
      console.log("🚀 ~ PaymentProviderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async paystackVerifyTransaction(
    ref: string,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {

      const axiosConfig: requestProp = {
        url: envConfig.PAYSTACK_BASE_URL + `/transaction/verify/${ref}`,
        method: "GET",
        headers: {
          authorization: "Bearer " + envConfig.PAYSTACK_SECRET_KEY
        }
      }
      const verify = await axiosRequestFunction(axiosConfig)
      return verify
    } catch (error: any) {
      console.log("🚀 ~ PaymentProviderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }



}

export default PaymentProviderService;