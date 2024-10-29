import UserModel from "@/resources/user/user.model";
import { axiosRequestFunction, generateUnusedOrderId, getRandomRef, uniqueCode } from "@/utils/helpers";
import {
  comparePassword,
  createToken,
  generateOtpModel,
  isOtpCorrect
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
  GetDeliveryRateDto
} from "./delivery.dto";
import { hashPassword } from "@/utils/helpers/token";
import { StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import productModel from "../product/product.model";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import MailService from "../mail/mail.service";
import envConfig from "@/utils/config/env.config";
import orderModel from "../order/order.model";

class DeliveryService {
  private Order = orderModel;

  public async getRate(
    payload: GetDeliveryRateDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const order = await this.Order.findById(payload.parcel_id)
      if (!order) {
        return {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "order not found"
        }
      }
      const itemsInOrder = order.items
      let items = []
      for (const item of itemsInOrder) {
        items.push({
          desciption: item.description,
          name: item.product_name,
          type: "parcel",
          currency: "NGN",
          value: item.unit_price,
          quantity: item.quantity,
          weight: 0.2
        })
      }

      const createParcelPayload: any = {
        description: "parcel creation",
        items,
        packaging: getRandomRef(),
        weight_unit: "kg"
      }
      let createParcel: ResponseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_BAD_GATEWAY,
        message: ""
      }
      await axiosRequestFunction({
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/parcels`,
        method: "POST",
        body: createParcelPayload,
        headers: {
          Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      })
        .then((parcel: ResponseData) => {
          createParcel = parcel

        })


      // const axiosCall = await axiosRequestFunction({
      //   url: envConfig.TERMINAL_AFRICA_BASE_URL + `/rates/shipment`,
      //   method: "GET",
      //   params: payload,
      //   headers: {
      //     Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
      //   }
      // })

      return createParcel

    } catch (error: any) {
      console.log("🚀 ~ DeliveryService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

}

export default DeliveryService;