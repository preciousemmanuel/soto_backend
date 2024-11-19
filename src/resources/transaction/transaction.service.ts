import UserModel from "@/resources/user/user.model";
import { getRandomRef, uniqueCode } from "@/utils/helpers";
import {
  comparePassword,
  createToken,
  generateOtpModel,
  isOtpCorrect
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
  FullPaymentLinkDto,
  GeneratePaymentLinkDto,
  VerificationDto,
} from "./transaction.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OtpPurposeOptions, PaymentProvider, PaystackWebHookEvents, StatusMessages, TransactionNarration, TransactionStatus, TransactionType, UserTypes } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import TransactionLogModel from "./transactionLog.model";
import cloudUploader from "@/utils/config/cloudUploader";
import MailService from "../mail/mail.service";
import orderModel from "../order/order.model";
import PaymentProviderService from "./paypment-provider.service";
import envConfig from "@/utils/config/env.config";
import OrderService from "../order/order.service";

class TransactionService {
  private TransactionLog = TransactionLogModel;
  private User = UserModel
  private Order = orderModel
  private paymentProviderService = new PaymentProviderService()
  private orderService = new OrderService()

  public async initializePayment(
    generatePaymentLink: GeneratePaymentLinkDto,
    user: InstanceType<typeof this.User>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const ref = getRandomRef()
      const existingLog = await this.TransactionLog.findOne({
        reference: ref
      })

      if (existingLog) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Duplicate transaction detected"
        }
        return responseData
      }
      let foundNarration: any
      let narration_name: string
      switch (generatePaymentLink.narration) {
        case TransactionNarration.ORDER:
          narration_name = TransactionNarration.ORDER
          foundNarration = await this.Order.findById(generatePaymentLink.narration_id)
          break;

        default:
          break;
      }
      if (!foundNarration) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: TransactionNarration.ORDER + " Not Found"
        }
        return responseData
      }

      const linkPayload: FullPaymentLinkDto = {
        ...generatePaymentLink,
        user: user,
        txnRef: ref
      }
      const txnLog = await this.TransactionLog.create({
        user: user?._id,
        amount: linkPayload.amount,
        narration: linkPayload.narration,
        narration_id: linkPayload.narration_id,
        reference: ref,
        type: TransactionType.DEBIT
      })

      switch (envConfig.PAYMENT_PROVIDER) {
        case PaymentProvider.PAYSTACK:
          responseData = await this.paymentProviderService.paystackPaymentLink(linkPayload)

          break;

        default:
          responseData = await this.paymentProviderService.paystackPaymentLink(linkPayload)
          break;
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ BusinessService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async paystackCallbackService(
    payload: any,
  ): Promise<ResponseData> {
    let responseData: ResponseData = {
      status: StatusMessages.success,
      code: HttpCodes.HTTP_OK,
      message: "Transaction Successful",
    }
    try {
      const {
        event,
        data
      } = payload
      const authorization = data?.authorization;
      const metadata = data?.metadata;
      const narration = metadata?.narration;

      const { reference, txRef, tx_ref } = data;
      const ref = reference || txRef || tx_ref;
      const ongoningTransaction = await this.TransactionLog.findOne({
        reference: ref
      })
      if (!ongoningTransaction) {
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Ongoing Transaction Not Found",
        }
        return responseData
      }
      if (ongoningTransaction && (ongoningTransaction.status === TransactionStatus.SUCCESSFUL)) {
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Transaction Already Completed",
        }
        return responseData
      }
      const narration_id = ongoningTransaction.narration_id || ""
      switch (event) {
        case PaystackWebHookEvents.TRANSACTION_SUCCESSFUL:
          ongoningTransaction.status = TransactionStatus.SUCCESSFUL
          await ongoningTransaction.save()
          switch (narration) {
            case TransactionNarration.ORDER:
              const completeOrder = await this.orderService.confirmOrderPayment(narration_id)
              responseData = completeOrder
              break;

            default:

              break;
          }
          break;

        default:
          ongoningTransaction.status = TransactionStatus.FAILED
          await ongoningTransaction.save()
          responseData.message = "Transaction Failed"
          break;
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ BusinessService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }


}

export default TransactionService;