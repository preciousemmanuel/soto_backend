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
  GetCitiesDto,
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
    let responseData: ResponseData ={
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: "deafult error"
    }

    try {
      const order = await this.Order.findById(payload.parcel_id)
      if (!order) {
        return {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "order not found"
        }
      }
      const packaging = {
        height: 5,
        length: 40,
        name: 'Soft Packaging',
        size_unit: 'cm',
        type: 'soft-packaging',
        weight: 0.01, 
        weight_unit: 'kg',		
        width: 30,
      }
      await axiosRequestFunction({
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/packaging`,
        method: "POST",
        body: packaging,
        headers: {
          Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      })
      .then(async (packageData) => {
        console.log("🚀 PACKAGE CREATION STAGE:", packageData?.data?.message)
        const itemsInOrder = order.items
        let items = []
        for (const item of itemsInOrder) {
          items.push({
            description: item.description || "fine item",
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
          packaging: packageData.data?.data?.packaging_id,
          weight_unit: packageData.data?.data?.weight_unit
        }
        await axiosRequestFunction({
          url: envConfig.TERMINAL_AFRICA_BASE_URL + `/parcels`,
          method: "POST",
          body: createParcelPayload,
          headers: {
            Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
          }
        })
        .then(async (parcel: ResponseData) => {
        console.log("🚀 PARCEL CREATION STAGE:", parcel?.data?.message)

          const shipment_address_1 = {
            country: "NG",
            city:"Lagos",
            line1: "6, iyanuwura close shasha egbeda",
            state: "lagos",
          }
          const shipment_address_2 = {
            country: "NG",
            city:"Lagos",
            line1: "26, dr ezekuse close, admiralty road",
            state: "lagos",
          }
          await axiosRequestFunction({
            url: envConfig.TERMINAL_AFRICA_BASE_URL + `/addresses`,
            method: "POST",
            body: shipment_address_2,
            headers: {
              Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
            }
          })
          .then(async (addressData: ResponseData) => {
            console.log("🚀 ADDRESS CREATION STAGE:::", addressData?.data?.message)
            
            const shipment_payload = {
              currency: "NGN",
              pickup_address: "AD-7RHWEHMTOW5UMOFM",
              delivery_address:addressData?.data?.data?.address_id ,
              //  pickup_address: "AD-7RHWEHMTOW5UMOFM",
              // delivery_address: "AD-PYQP56G6YVEJ3VYR",
              parcel_id: parcel?.data?.data?.parcel_id,
              cash_on_delivery: true
            }
            await axiosRequestFunction({
              url: envConfig.TERMINAL_AFRICA_BASE_URL + `/rates/shipment`,
              method: "GET",
              params: shipment_payload,
              headers: {
                Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
              }
            })
            .then((res: ResponseData) => {
              console.log("🚀 RATE FETCHING CREATION STAGE:::", res?.data?.message)
                responseData = {
                  status: res.status,
                  code: res.code,
                  message: res.message,
                  data: res?.data?.data
                }
              })
            .catch((e) => {
              console.log("🚀 ~ RATE FETCHING CREATION STAGE ~ ERROR:", e)
              responseData.message = e.toString()
              return responseData
            })

          })
          .catch((e) => {
            console.log("🚀 ~ ADDRESS CREATION STAGE:: ERROR ~ e:", e)
            responseData.message = e.toString()
            return responseData
          })

        })
        .catch((e) => {
          console.log("🚀 ~ PARCEL CREATION STAGE:: ERROR ~ e:", e)
          responseData.message = e.toString()
          return responseData
        })

      })
      .catch((e) => {
        console.log("🚀 ~ PACKAGE CREATION STAGE::: ERROR ~ e:", e)
        responseData.message = e.toString()
        return responseData
      })
      
      return responseData

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

   public async getStates(
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: "deafult error"
    }

    try {
      
      await axiosRequestFunction({
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/states`,
        method: "GET",
        params: {
          country_code:"NG"
        },
        headers: {
          Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      })
      .then((res) => {
        responseData = {
          status: res.status,
          code: res.code,
          message: res?.data?.message,
          data: res?.data?.data
        }
      })
      .catch((e) => {
        console.log("🚀 ~ FETCH STATES ERROR ~ e:", e)
        responseData.message = e.toString()
        return responseData
      })
      
      return responseData

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

   public async getCities(
    payload:GetCitiesDto
  ): Promise<ResponseData> {
    let responseData: ResponseData ={
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: "deafult error"
    }

    try {
      await axiosRequestFunction({
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/cities`,
        method: "GET",
        params: {
          country_code:payload.country_code,
          ...(payload?.state_code && {state_code: payload?.state_code})
        },
        headers: {
          Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      })
      .then((res) => {
        responseData = {
          status: res.status,
          code: res.code,
          message: res?.data?.message,
          data: res?.data?.data
        }
      })
      .catch((e) => {
        console.log("🚀 ~ FETCH CITIES ERROR ~ e:", e)
        responseData.message = e.toString()
        return responseData
      })
      
      return responseData

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