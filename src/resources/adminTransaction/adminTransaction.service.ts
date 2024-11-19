import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
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
} from "./adminTransaction.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OrderStatus, OtpPurposeOptions, StatusMessages, UserTypes } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import MailService from "../mail/mail.service";
import { endOfToday } from "date-fns";
import orderModel from "../order/order.model";
import productModel from "../product/product.model";
import orderDetailsModel from "../order/orderDetails.model";
import { backDaterArray, FacetStage } from "@/utils/interfaces/base.interface";
import { start } from "repl";

class AdminTransactionService {
  private User = UserModel
  private Order = orderModel
  private Product = productModel
  private OrderDetails = orderDetailsModel
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


}

export default AdminTransactionService;