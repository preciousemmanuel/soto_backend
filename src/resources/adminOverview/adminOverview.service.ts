import UserModel from "@/resources/user/user.model";
import { axiosRequestFunction, formatPhoneNumber, uniqueCode } from "@/utils/helpers";
import {
  comparePassword,
  createToken,
  generateOtpModel,
  isOtpCorrect
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
  CreateBusinessDto,
  OverviewDto,
  VerificationDto,
} from "./adminOverview.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OrderStatus, OtpPurposeOptions, ProductMgtOption, StatusMessages, UserTypes } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import MailService from "../mail/mail.service";
import { endOfToday } from "date-fns";
import orderModel from "../order/order.model";
import productModel from "../product/product.model";
import orderDetailsModel from "../order/orderDetails.model";
import { backDaterArray, FacetStage, ProductMgtDto } from "@/utils/interfaces/base.interface";
import { start } from "repl";
import { getPaginatedRecords, paginateInfo } from "@/utils/helpers/paginate";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import { requestProp } from "../mail/mail.interface";
import envConfig from "@/utils/config/env.config";
import { AddShippingAddressDto } from "../user/user.dto";
import shipmentModel from "../delivery/shipment.model";

class AdminOverviewService {
  private User = UserModel
  private Order = orderModel
  private Product = productModel
  private OrderDetails = orderDetailsModel
  private Shipment = shipmentModel
  private mailService = new MailService()

  public async getOverview(
    payload: any,
    advanced_report_timeline: backDaterArray[]
  ): Promise<ResponseData> {
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:""
    }
    try {
      const {
        previous_start_date,
        previous_end_date,
        start_date,
        end_date = endOfToday(),
        page,
        limit,
      } = payload;
      let revenue_amount: number = 0
      let previous_revenue_amount: number = 0
      let revenue_percentage: number = 0
      let visitors_amount: number = 0
      let previous_visitors_amount: number = 0
      let visitors_percentage: number = 0
      let orders_amount: number = 0
      let previous_orders_amount: number = 0
      let orders_percentage: number = 0
      let conversion_amount: number = 0
      let previous_conversion_amount: number = 0
      let conversion_percentage: number = 0
      let abandonned_cart_amount: number = 0
      let previous_abandonned_cart_amount: number = 0
      let abandonned_cart_revenue: number = 0
      let abandonned_cart_percentage: number = 0
  
      const revenuePipeline = [
        {
          $facet: {
            sum1: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date)
                  },
                  // status: OrderStatus.DELIVERED
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$amount' }
                }
              }
            ],
            sum2: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(previous_start_date),
                    $lte: new Date(previous_end_date)
                  },
                  // status: OrderStatus.DELIVERED
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$amount' }
                }
              }
            ]
          }
        },
        {
          $project: {
            sumAmount1: { $arrayElemAt: ['$sum1.totalAmount', 0] },
            sumAmount2: { $arrayElemAt: ['$sum2.totalAmount', 0] }
          }
        },
        {
          $addFields: {
            percentageDifference: {
              $cond: {
                if: { $eq: ['$sumAmount1', 0] },
                then: { $cond: { if: { $eq: ['$sumAmount2', 0] }, then: 0, else: 100 } },
                else: { $multiply: [{ $divide: [{ $subtract: ['$sumAmount2', '$sumAmount1'] }, '$sumAmount1'] }, 100] }
              }
            }
          }
        }
      ];

      const revenueAggregate = await this.Order.aggregate(revenuePipeline);
      console.log("🚀 ~ AdminOverviewService ~ revenueAggregate:", revenueAggregate)
      if(revenueAggregate.length > 0) {
        revenue_amount = revenueAggregate[0]?.sumAmount1 || 0
        previous_revenue_amount = revenueAggregate[0]?.sumAmount2 || 0
        revenue_percentage = revenueAggregate[0]?.percentageDifference || 0
      }

      const orderPipeline = [
        {
        $facet: {
          count1: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(start_date),
                  $lte: new Date(end_date)
                },
                // status: OrderStatus.DELIVERED
              }
            },
            {
              $count: 'totalCount' 
            }
          ],
          count2: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(previous_start_date),
                  $lte: new Date(previous_end_date)
                },
                // status: OrderStatus.DELIVERED
              }
            },
            {
              $count: 'totalCount'
            }
          ]
        }
      },
      {
        $project: {
          countAmount1: { $arrayElemAt: ['$count1.totalCount', 0] },
          countAmount2: { $arrayElemAt: ['$count2.totalCount', 0] }
        }
      },
      {
        $addFields: {
          percentageDifference: {
            $cond: {
              if: { $eq: ['$countAmount1', 0] },
              then: { $cond: { if: { $eq: ['$countAmount2', 0] }, then: 0, else: 100 } },
              else: { $multiply: [{ $divide: [{ $subtract: ['$countAmount2', '$countAmount1'] }, '$countAmount1'] }, 100] }
            }
          }
        }
      }
    ];

   
    const orderAggregate = await this.Order.aggregate(orderPipeline);
    console.log("🚀 ~ AdminOverviewService ~ orderAggregate:", orderAggregate)
    if(orderAggregate.length > 0) {
      orders_amount = orderAggregate[0]?.countAmount1 || 0
      previous_orders_amount = orderAggregate[0]?.countAmount2 || 0
      orders_percentage = orderAggregate[0]?.percentageDifference || 0
    }
    const advanced_report_pipeline = []

    const facetStage: {$facet: FacetStage} = {
      $facet: {}
    }
    advanced_report_timeline.forEach((range) => {
      const {
        start,
        end,
        day,
        month
      } = range
      const key = day || month || "date"

      if(key){
        facetStage.$facet[key] = [
          {
            $match: {
              createdAt: {
                $gte: new Date(start),
                $lte: new Date(end)
              },
              // status: OrderStatus.DELIVERED
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' }
            }
          },
          {
            $project: {
              _id: 0,
              amount: { $ifNull: ['$totalAmount', 0] } 
            }
          }
        ];
      }
    })
    advanced_report_pipeline.push(facetStage)
    advanced_report_pipeline.push({
      $project: {
        results: {
          $reduce: {
            input: { $objectToArray: '$$ROOT' },
            initialValue: [],
            in: {
              $concatArrays: [
                '$$value',
                [{
                  day_or_month: "$$this.k",
                  amount: { $ifNull: [{ $arrayElemAt: ["$$this.v.amount", 0] }, 0] }
                }]
              ]
            }
          }
        }
      }
    });

    const advanced_report_aggregate = await this.Order.aggregate(advanced_report_pipeline)
    const advanced_report = advanced_report_aggregate.length > 0 ?  advanced_report_aggregate[0]?.results : []

    const abandonnedCartPipeline = [
        {
          $facet: {
            sum1: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date)
                  },
                  status: OrderStatus.PENDING
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$amount' }
                }
              }
            ],
            sum2: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(previous_start_date),
                    $lte: new Date(previous_end_date)
                  },
                  status: OrderStatus.PENDING
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$amount' }
                }
              }
            ],
            count: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(previous_start_date),
                    $lte: new Date(previous_end_date)
                  },
                  status: OrderStatus.PENDING
                }
              },
             {
              $count: 'totalCount'
            }
            ]
          },
          
        },
        {
          $project: {
            sumAmount1: { $arrayElemAt: ['$sum1.totalAmount', 0] },
            sumAmount2: { $arrayElemAt: ['$sum2.totalAmount', 0] },
            totalCount: { $arrayElemAt: ['$count.totalCount', 0] },
          }
        },
        {
          $addFields: {
            percentageDifference: {
              $cond: {
                if: { $eq: ['$sumAmount1', 0] },
                then: { $cond: { if: { $eq: ['$sumAmount2', 0] }, then: 0, else: 100 } },
                else: { $multiply: [{ $divide: [{ $subtract: ['$sumAmount2', '$sumAmount1'] }, '$sumAmount1'] }, 100] }
              }
            }
          }
        }
      ];

      const cartAggregate = await this.Order.aggregate(abandonnedCartPipeline)
      if(cartAggregate.length > 0) {
        abandonned_cart_amount =  cartAggregate[0]?.totalCount  || 0
        abandonned_cart_revenue = cartAggregate[0]?.sumAmount1 || 0
        abandonned_cart_percentage = cartAggregate[0]?.percentageDifference || 0
      }

    responseData.data = {
      revenue: {
        amount: revenue_amount,
        percentage_change: revenue_percentage
      },
      visitors: {
        amount: visitors_amount,
        percentage_change: visitors_percentage
      },
      orders: {
        amount: orders_amount,
        percentage_change: orders_percentage
      },
      conversion: {
        amount: conversion_amount,
        percentage_change: conversion_percentage
      },
      advanced_report,
      cart: {
        abandonned_cart: abandonned_cart_amount,
        abandonned_revenue: abandonned_cart_revenue,
        percentage: abandonned_cart_percentage
      }
    }
  
    responseData.message = "Overview retreived successfully"
    return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async getBestSellingProducts(payload: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Best Seller Retrieved Successfully"
    }
    try {
      const {
        limit,
        page,
        start_date,
        end_date
      } = payload
      const skip = (page - 1) * limit
      let $match = {}
      // if(start_date && end_date){
      //   $match = {
      //     createdAt: {
      //       $gte: new Date(start_date),
      //       $lt: new Date(end_date)
      //     }
      //   }
      // }

      const aggregateResult = await this.OrderDetails.aggregate([
        // {
        //   ...((start_date && end_date) && {
        //     $match:{
        //       createdAt: {
        //         $gte: new Date(start_date),
        //         $lt: new Date(end_date)
        //       }
        //     }
        //   }),
        // },
         {
          $project: {
            product_id: 1,
            product_name: 1,
            total_price: { $multiply: ['$unit_price', '$quantity'] },
            quantity: 1
          }
        },
        {
          $group: {
            _id: '$product_id',
            product_name: { $first: '$product_name' },
            total_quantity: { $sum: '$quantity' },
            total_price: { $sum: '$total_price' }
          }
        },
        {
          $sort: { total_quantity: -1 } 
        },
        {
          $skip: skip 
        },
        {
          $limit: limit 
        },
        {
      $group: {
        _id: null, 
          products: { $push: { product_id: '$_id', product_name: '$product_name', total_quantity: '$total_quantity', total_price: '$total_price' } },
          total_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          products: 1,
          total_count: 1
        }
      }
      ])
      const data = aggregateResult.length > 0 ? aggregateResult[0]?.products : []
      const totalCount = aggregateResult.length > 0 ? aggregateResult[0]?.total_count : 0
      const pageCount = Math.ceil(Number(totalCount) / limit)
      const currentPage = page
      const hasNext = page * limit < totalCount
      const pagination = {
        data,
        pagination: {
          pageSize: limit,
          totalCount,
          pageCount,
          currentPage,
          hasNext 
        }
      }
      responseData.data = pagination


      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ getBestSellingProducts ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }


   public async getLatestOrders(payload: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Latest Orders Retrieved Successfully"
    }
    try {
      const {
        limit,
        page,
        start_date,
        end_date
      } = payload
      const skip = (page - 1) * limit
      let $match = {}
      // if(start_date && end_date){
      //   $match = {
      //     createdAt: {
      //       $gte: new Date(start_date),
      //       $lt: new Date(end_date)
      //     }
      //   }
      // }

      const aggregateResult = await this.OrderDetails.aggregate([
        // {
        //   ...((start_date && end_date) && {
        //     $match:{
        //       createdAt: {
        //         $gte: new Date(start_date),
        //         $lt: new Date(end_date)
        //       }
        //     }
        //   }),
        // },
         {
          $project: {
            product_id: 1,
            product_name: 1,
            quantity: 1,
            unit_price: 1,
            status: 1,
            createdAt: 1,
            total_price: { $multiply: ['$unit_price', '$quantity'] },
          }
        },
        // {
        //   $group: {
        //     _id: '$product_id',
        //     product_name: { $first: '$product_name' },
        //     total_quantity: { $sum: '$quantity' },
        //     total_price: { $sum: '$total_price' }
        //   }
        // },
        {
          $sort: { createdAt: -1 } 
        },
        {
          $skip: skip 
        },
        {
          $limit: limit 
        },
        {
      $group: {
        _id: null, 
          products: { 
            $push: { 
              product_id: '$product_id', 
              product_name: '$product_name', 
              quantity: '$quantity', 
              unit_price: '$unit_price', 
              createdAt: '$createdAt', 
              status: '$status', 
              total_price: '$total_price'
            } },
          total_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          products: 1,
          total_count: 1
        }
      }
      ])
      const data = aggregateResult.length > 0 ? aggregateResult[0]?.products : []
      const totalCount = aggregateResult.length > 0 ? aggregateResult[0]?.total_count : 0
      const pageCount = Math.ceil(Number(totalCount) / limit)
      const currentPage = page
      const hasNext = page * limit < totalCount
      const pagination = {
        data,
        pagination: {
          pageSize: limit,
          totalCount,
          pageCount,
          currentPage,
          hasNext 
        }
      }
      responseData.data = pagination


      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ getLatestOrders ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async getOrders(payload: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Orders Retrieved Successfully"
    }
    try {
      const {
        limit,
        page,
        start_date,
        end_date,
        status,
        tracking_id
      } = payload
      const filter = {
        ...(status && {status}),
        ...(tracking_id && {tracking_id}),
        ...((start_date && end_date) && {
          createdAt:{
            $gte: start_date,
            $lte: end_date,
          }
        })
      }
      const records = await getPaginatedRecords(this.Order, {
        limit,
        page,
        data: filter,
        populateObj: {
          path:"user",
          select:"FirstName LastName ProfileImage"
        }
      })
      
      responseData.data = records


      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ getOrders ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }
  

  public async viewAnOrder(order_id: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Order Retrieved Successfully"
    }
    try {
      const order = await this.Order.findById(order_id)
      .populate({
        path:"items.vendor",
        select:"firstName lastName Email ProfileImage PhoneNumber"
      })
      .populate({
        path:"user",
        select:"FirstName LastName ProfileImage Email PhoneNumber"
      })
        if(!order) {
          return {
            status: StatusMessages.error,
            code: HttpCodesEnum.HTTP_BAD_REQUEST,
            message: "Order Not Found"
          }
        }
      
      responseData.data = order
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ viewAnOrder ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

   public async getProductMgts(payload: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Orders Retrieved Successfully"
    }
    try {
      const {
        limit,
        page,
        start_date,
        end_date,
        status,
        product_name,
        select_type
      } = payload
      let filter: object
      let productData: ProductMgtDto
      let paginateRequest
      let product_type: string
      switch (select_type) {
        case ProductMgtOption.SOLD:
          filter = {
            ...(status && {status}),
            ...(product_name && {product_name: {$regex: product_name, $options:"i"}}),
            ...((start_date && end_date) && {
              createdAt:{
                $gte: start_date,
                $lte: end_date,
              }
            }),
             total_quantity_sold:{$gt: 0},
          }
          paginateRequest = await getPaginatedRecords(this.Product, {
            limit,
            page,
            data: filter
          })
          paginateRequest.data.map((prod) => {
            productData = {
              name: prod.product_name,
              description: prod.description,
              images: prod.images,
              quantity_sold: prod.total_quantity_sold,
              quantity: prod.product_quantity,
              price: prod.unit_price,
              discounted_price: prod.discount_price || 0 ,
              is_discounted: prod.is_discounted,
            }
          })
          product_type = 'Sold'
          break;
        case ProductMgtOption.PROMO:
          filter = {
            ...(status && {status}),
            ...(product_name && {product_name: {$regex: product_name, $options:"i"}}),
            ...((start_date && end_date) && {
              createdAt:{
                $gte: start_date,
                $lte: end_date,
              }
            }),
             is_discounted:true,
          }
          paginateRequest = await getPaginatedRecords(this.Product, {
            limit,
            page,
            data: filter
          })
          paginateRequest.data.map((prod) => {
            productData = {
              name: prod.product_name,
              description: prod.description,
              images: prod.images,
              quantity_sold: prod.total_quantity_sold,
              quantity: prod.product_quantity,
              price: prod.unit_price,
              discounted_price: prod.discount_price || 0 ,
              is_discounted: prod.is_discounted,
            }
          })
          product_type = 'Promo'
          break;
        case ProductMgtOption.OUT_OF_STOCK:
          filter = {
            ...(status && {status}),
            ...(product_name && {product_name: {$regex: product_name, $options:"i"}}),
            ...((start_date && end_date) && {
              createdAt:{
                $gte: start_date,
                $lte: end_date,
              }
            }),
             product_quantity:0
          }
          paginateRequest = await getPaginatedRecords(this.Product, {
            limit,
            page,
            data: filter
          })
          paginateRequest.data.map((prod) => {
            productData = {
              name: prod.product_name,
              description: prod.description,
              images: prod.images,
              quantity_sold: prod.total_quantity_sold,
              quantity: prod.product_quantity,
              price: prod.unit_price,
              discounted_price: prod.discount_price || 0 ,
              is_discounted: prod.is_discounted,
            }
          })
          product_type = 'Out of Stock'
          break;
        case ProductMgtOption.RETURNED:
          filter = {
            ...(status && {status: OrderStatus.RETURNED}),
            ...(product_name && {product_name: {$regex: product_name, $options:"i"}}),
            ...((start_date && end_date) && {
              createdAt:{
                $gte: start_date,
                $lte: end_date,
              }
            }),
          }

          paginateRequest = await getPaginatedRecords(this.OrderDetails, {
            limit,
            page,
            data: filter,
            populateObj:{
              path:"product_id",
              select:"images total_quantity_sold"
            }
          })
          paginateRequest.data.map((prod) => {
            productData = {
              name: prod.product_name,
              description: prod.description || "",
              images: prod.toObject()?.product_id?.images || [],
              quantity_sold: prod.toObject()?.product_id?.total_quantity_sold || 0,
              quantity: prod.quantity,
              price: prod.unit_price,
              discounted_price: prod.unit_price || 0 ,
              is_discounted: prod.is_discounted,
            }
          })
          product_type = 'Returned'
          break;
        default:
          filter = {
            ...(status && {status}),
            ...(product_name && {product_name: {$regex: product_name, $options:"i"}}),
            ...((start_date && end_date) && {
              createdAt:{
                $gte: start_date,
                $lte: end_date,
              }
            }),
            
            // is_verified:true,
          }
            console.log("🚀 ~ AdminOverviewService ~ getProductMgts ~ filter:", filter)
          
          paginateRequest = await getPaginatedRecords(this.Product, {
            limit,
            page,
            data: filter
          })
          paginateRequest.data.map((prod) => {
            productData = {
              name: prod.product_name,
              description: prod.description,
              images: prod.images,
              quantity_sold: prod.total_quantity_sold,
              quantity: prod.product_quantity,
              price: prod.unit_price,
              discounted_price: prod.discount_price || 0 ,
              is_discounted: prod.is_discounted,
            }
          })
          product_type = 'Active'
          break;
      }      
      responseData.message = product_type + ' Products Retreived Successfully'
      responseData.data = paginateRequest
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ getOrders ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async createShippingAddress(payload: AddShippingAddressDto):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Shipping Address Created Successfully"
    }
    try {
      const {
        user,
        address,
        is_admin = false,
        city,
        country = 'NG',
        state,
        postal_code
      } = payload
      let body:object
      let filter_id: string = String(user._id)
      switch (is_admin) {
        case true:
        console.log("🚀 ~ AdminOverviewService ~ createShippingAddress ~ is_admin:", is_admin)

          body = {
            first_name: user?.FirstName,
            last_name: user?.LastName,
            email: user?.Email,
            line1: address,
            city,
            country:"NG",
            state,
            zip: postal_code
          }
          break;
        default:
        console.log("🚀 ~ AdminOverviewService ~ createShippingAddress ~ is_admin:", is_admin)
        filter_id = String(user._id)
        body = {
          first_name: user.FirstName,
          last_name: user.LastName,
          email: user.Email,
          phone: formatPhoneNumber(user.PhoneNumber),
          line1: address,
          city,
          country:"NG",
          state,
          zip: postal_code
        }
          break;
      }     
      const axiosConfig: requestProp = {
        method:"POST",
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/addresses`,
        body: body,
        headers:{
          authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      }
      const createAddressCall = await axiosRequestFunction(axiosConfig)
      if(createAddressCall.status === StatusMessages.error) {
        return createAddressCall
      }
      const addressData:any = createAddressCall.data.data
      const addressUpdate = {
        ShippingAddress: {
          full_address: `${address}, ${city}, ${state}, ${country}`,
          address,
          address_id: addressData.address_id,
          city: addressData.city,
          coordinates: addressData.coordinates,
          country,
          postal_code,
        },
        shipping_address_id: addressData.address_id
      }
      const updatedAddress = await this.User.findByIdAndUpdate(filter_id, addressUpdate, {new: true})
      responseData.data = updatedAddress      
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ createShippingAddress ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

   public async createShipment(payload: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Shipment Created Successfully"
    }
    try {
      const {
        user,
        order_id,
        soto_user
      } = payload
      const order = await this.Order.findOne({
        _id: order_id,
        status: OrderStatus.BOOKED
      })
      if(!order) {
        return {
          status: StatusMessages.error,
          code: HttpCodesEnum.HTTP_BAD_REQUEST,
          message:"Order Not Found"
        }
      }
      const body = {
        address_from: soto_user.shipping_address_id,
        address_to: order.delivery_vendor.delivery_address,
        parcel: order.delivery_vendor.parcel,
      }
     
      const axiosConfig: requestProp = {
        method:"POST",
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/shipments`,
        body,
        headers:{
          authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      }
      const createShipmentCall = await axiosRequestFunction(axiosConfig)
      if(createShipmentCall.status === StatusMessages.error) {
        return createShipmentCall
      }
      const shipmentData:any = createShipmentCall.data.data
      const createShipmentData = {
       address_from: shipmentData.address_from,
       address_return: shipmentData.address_return,
       address_to: shipmentData.address_to,
       events: shipmentData.events,
       created_shipment_id: shipmentData.id,
       parcel: shipmentData.parcel,
       shipment_id: shipmentData.shipment_id,
       status: shipmentData.status,
       order: order._id
      }
      const newShipment = await this.Shipment.create(createShipmentData)
      await this.Order.findByIdAndUpdate(order._id, {
        shipment: newShipment._id
      })
      
      responseData.data = newShipment      
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ createShipment ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async arrangePickup(payload: any):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Pickup Arranged Successfully"
    }
    try {
      const {
        user,
        order_id,
        soto_user
      } = payload
      const order = await this.Order.findOne({
        _id: order_id,
        status: OrderStatus.BOOKED
      })
      if(!order) {
        return {
          status: StatusMessages.error,
          code: HttpCodesEnum.HTTP_BAD_REQUEST,
          message:"Order Not Found"
        }
      }
       const body = {
        rate_id: order.toObject().delivery_vendor.rate_id,
        parcel: order.delivery_vendor.parcel,

      }
     
      const axiosConfig: requestProp = {
        method:"POST",
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/shipments/pickup`,
        body,
        headers:{
          authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      }
      const createShipmentCall = await axiosRequestFunction(axiosConfig)
      if(createShipmentCall.status === StatusMessages.error) {
        return createShipmentCall
      }
      const shipmentData:any = createShipmentCall.data.data
      const createShipmentData = {
       address_from: shipmentData.address_from,
       address_return: shipmentData.address_return,
       address_to: shipmentData.address_to,
       events: shipmentData.events,
       extras: shipmentData.extras,
       created_shipment_id: shipmentData.id || shipmentData._id,
       parcel: shipmentData.parcel,
       shipment_id: shipmentData.shipment_id,
       status: shipmentData.status,
       order: order._id
      }
      const newShipment = await this.Shipment.create(createShipmentData)
      await this.Order.findByIdAndUpdate(order._id, {
        shipment: newShipment._id
      })
      
      responseData.data = newShipment      
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ createShipment ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async trackShipment(order_id: string):Promise<ResponseData>{
    let responseData: ResponseData = {
      status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message:"Shipment Tracked Successfully"
    }
    try {
      const shipment = await this.Shipment.findOne({
        order: order_id,
      })
      if(!shipment) {
        return {
          status: StatusMessages.error,
          code: HttpCodesEnum.HTTP_BAD_REQUEST,
          message:"Shipment Not Found"
        }
      }
       const shipment_id = String(shipment.toObject().shipment_id)
     
      const axiosConfig: requestProp = {
        method:"GET",
        url: envConfig.TERMINAL_AFRICA_BASE_URL + `/shipments/track/${shipment_id}`,
        headers:{
          authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`
        }
      }
      const trackShipmentCall = await axiosRequestFunction(axiosConfig)
      if(trackShipmentCall.status === StatusMessages.error) {
        return trackShipmentCall
      }
      const shipmentData:any = trackShipmentCall.data.data
      const trackShipmentData = {
       ...shipmentData
      }
      const trackedShipment = await this.Shipment.findByIdAndUpdate(shipment._id, 
        trackShipmentData,
        {new: true}
      )
     
      responseData.data = trackedShipment      
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ AdminOverviewService ~ trackShipment ~ error:", error)
       responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }
  

}

export default AdminOverviewService;