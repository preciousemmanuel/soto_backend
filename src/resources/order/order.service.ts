import UserModel from "@/resources/user/user.model";
import { generateUnusedOrderId, uniqueCode } from "@/utils/helpers";
import {
  comparePassword,
  createToken,
  generateOtpModel,
  isOtpCorrect
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
  AddToCartDto,
  CreateOrderDto,
  FetchMyOrdersDto,
  RemoveFromCartDto,
} from "./order.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OrderStatus, OtpPurposeOptions, StatusMessages, UserTypes } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import orderModel from "./order.model";
import productModel from "../product/product.model";
import { ItemInCart, itemsToBeOrdered, orderItems } from "./order.interface";
import orderDetailsModel from "./orderDetails.model";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import cartModel from "./cart.model";
import MailService from "../mail/mail.service";

class OrderService {
  private Order = orderModel;
  private Cart = cartModel;
  private OrderDetail = orderDetailsModel
  private User = UserModel
  private Product = productModel
  private mailService = new MailService()

  public async addToCart(
    payload: AddToCartDto,
    user: InstanceType<typeof UserModel>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    let product_ids: string[] = []
    try {
      const openCart = await this.Cart.findOne({
        user: user?._id
      })
      const currentItemsInCart: any[] = openCart ? [...openCart.toObject().items] : []
      currentItemsInCart.push(...payload.items)
      for (const item of currentItemsInCart) {
        product_ids.push(item.product_id)
      }
      const products = await this.Product.find({
        _id: { $in: product_ids },
        // is_verified: true
      })

      const purpose = "cart"
      const processedItems = await this.processMathcingItems(currentItemsInCart, products, user, purpose)
      if (processedItems.status === StatusMessages.error) {
        return processedItems
      }

      if (openCart) {
        const current_items_in_cart = openCart.items
        current_items_in_cart.push(...processedItems?.data?.itemsInOrder)
        openCart.items = processedItems?.data?.itemsInOrder
        openCart.total_amount = processedItems?.data?.total_amount
        openCart.grand_total = processedItems?.data?.total_amount
        openCart.save()
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Product Added To Cart Successfully",
          data: openCart
        }

      } else {
        const newCart = await this.Cart.create({
          items: processedItems?.data?.itemsInOrder,
          total_amount: processedItems?.data?.total_amount,
          user: user._id,
          status: OrderStatus.PENDING,
          grand_total: processedItems?.data?.total_amount,
        })

        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Product Added To Cart Successfully",
          data: newCart
        }
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async removeFromCart(
    payload: RemoveFromCartDto,
    user: InstanceType<typeof UserModel>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const openCart = await this.Cart.findOne({
        user: user?._id
      })
      if (openCart) {
        const current_items_in_cart = openCart.items
        const current_total = openCart.total_amount
        const product = current_items_in_cart.find(item => String(item.product_id) === String(payload.product_id))
        const newItemsCart = current_items_in_cart.filter(item => String(item.product_id) !== String(payload.product_id))
        const product_quantity = product?.quantity || 0
        const product_unit_price = product?.unit_price || 0
        const new_total = current_total - (product_quantity * product_unit_price)
        const updatedCart = await this.Cart.findByIdAndUpdate(openCart._id, {
          items: newItemsCart,
          total_amount: new_total,
          grand_total: new_total
        }, { new: true })

        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Product Removed To Cart Successfully",
          data: updatedCart
        }

      } else {
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Product Removed To Cart Successfully",
          data: null
        }
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async createOrder(
    payload: CreateOrderDto,
    user: InstanceType<typeof UserModel>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    let product_ids: string[] = []
    try {
      for (const item of payload.items) {
        product_ids.push(item.product_id)
      }
      const products = await this.Product.find({
        _id: { $in: product_ids },
        // is_verified: true
      })

      const purpose = "cart"
      const processedItems = await this.processMathcingItems(payload.items, products, user, purpose)
      if (processedItems.status === StatusMessages.error) {
        return processedItems
      }

      const openCart = await this.Order.findOne({
        status: OrderStatus.PENDING
      })
      if (openCart) {
        openCart.items = processedItems?.data?.itemsInOrder
        openCart.total_amount = processedItems?.data?.total_amount
        openCart.shipping_address = payload.shipping_address || user.ShippingAddress?.full_address || ""
        openCart.grand_total = processedItems?.data?.total_amount
        openCart.payment_type = payload?.payment_type || openCart?.payment_type
        openCart.save()
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Order Created Successfully",
          data: openCart
        }

      } else {
        const tracking_id = await generateUnusedOrderId()
        const newOrder = await this.Order.create({
          items: processedItems?.data?.itemsInOrder,
          total_amount: processedItems?.data?.total_amount,
          user,
          status: OrderStatus.PENDING,
          shipping_address: payload.shipping_address || user.ShippingAddress?.full_address || "",
          grand_total: processedItems?.data?.total_amount,
          tracking_id,
          ...(payload?.payment_type && { payment_type: payload?.payment_type })
        })

        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_CREATED,
          message: "Order Created Successfully",
          data: newOrder
        }
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async processMathcingItems(
    items: orderItems[],
    products: InstanceType<typeof this.Product>[],
    user: InstanceType<typeof this.User>,
    purpose: string
  ): Promise<ResponseData> {
    let total_amount = 0
    let responseData: ResponseData
    const messages: string[] = []
    let itemsInOrder: itemsToBeOrdered[] = []
    try {
      for (const item2 of products) {
        for (const item of items) {
          const matchingProduct = String(item2._id) === String(item?.product_id)
          if (matchingProduct === true) {
            if (item.quantity > item2.product_quantity) {
              messages.push(`Available Quantities For ${item2.product_name} is ${item2.product_quantity}`)
            } else {
              itemsInOrder.push({
                product_id: String(item2?._id),
                product_name: item2?.product_name,
                description: item2?.description,
                vendor: String(item2?.vendor),
                images: item2?.images,
                quantity: item.quantity,
                height: item2.height,
                width: item2.width,
                weight: item2.weight,
                unit_price: item2?.unit_price,
                is_discounted: item2?.is_discounted,
              })
              const unit_price = (item2?.is_discounted ? item2?.discount_price : item2.unit_price) || 0
              const amount = item?.quantity * unit_price
              total_amount += amount
            }
          }
        }
      }
      if (messages.length > 0) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: messages.toString(),
        }
      } else {
        switch (purpose) {
          case "order":
            // this.createOrderDetails(itemsInOrder, user)
            break;
          default:
            break;
        }
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "",
          data: {
            itemsInOrder,
            total_amount
          }
        }
      }
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ processMathcingItems ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async getMyOrders(
    myOrdersDto: FetchMyOrdersDto,
    user: InstanceType<typeof this.User>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {

      const search = {
        ...((myOrdersDto?.filter?.start_date && myOrdersDto?.filter?.end_date) && {
          createdAt: {
            $gte: new Date(myOrdersDto?.filter?.start_date),
            $lte: new Date(myOrdersDto?.filter?.end_date)
          }
        }),
        ...(myOrdersDto?.filter?.status && {
          status: myOrdersDto?.filter?.status
        }),
        vendor: user?._id
      }

      var paginatedRecords = await getPaginatedRecords(
        this.OrderDetail, {
        limit: myOrdersDto?.limit,
        page: myOrdersDto?.page,
        data: search,
        populateObj: {
          path: "buyer",
          select: "FirstName LastName"
        },
        populateObj1: {
          path: "product_id",
          select: "product_name images product_quantity"
        }
      }
      )

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "success",
        data: paginatedRecords
      }
      return responseData

    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

   public async getMyOrdersBuyer(
    myOrdersDto: FetchMyOrdersDto,
    user: InstanceType<typeof this.User>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {

      const search = {
        ...((myOrdersDto?.filter?.start_date && myOrdersDto?.filter?.end_date) && {
          createdAt: {
            $gte: new Date(myOrdersDto?.filter?.start_date),
            $lte: new Date(myOrdersDto?.filter?.end_date)
          }
        }),
        ...(myOrdersDto?.filter?.status && {
          status: myOrdersDto?.filter?.status
        }),
        user: user?._id
      }

      var paginatedRecords = await getPaginatedRecords(
        this.Order, {
        limit: myOrdersDto?.limit,
        page: myOrdersDto?.page,
        data: search,
       
      }
      )

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "success",
        data: paginatedRecords
      }
      return responseData

    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  private async createOrderDetails(
    itemsInOrder: itemsToBeOrdered[] | ItemInCart[],
    user: any,
    Order: any,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const order_details: any[] = []
      for (const item of itemsInOrder) {
        order_details.push({
          ...item,
          buyer: user?._id,
          order: Order?._id
        })
      }
      const inserted = await this.OrderDetail.insertMany(order_details)

      const details_ids = []
      for (const item of inserted) {
        details_ids.push(item?._id)
      }
      if (details_ids.length > 0) {
        const details_to_vendors = await this.OrderDetail.find({
          _id: { $in: details_ids }
        })
        this.sendOrderToVendors(details_to_vendors)
      }

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "success",
        data: inserted
      }
      return responseData

    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async confirmOrderPayment(
    narration_id: string
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const order = await this.Order.findById(narration_id)

      if (!order) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Order Not Found"
        }
        return responseData
      }
      const user = await this.User.findById(order.user)

      const completedOrder = await this.Order.findByIdAndUpdate(order._id, {
        status: OrderStatus.BOOKED,
      }, { new: true })

      const updateData = order.toObject().items.map((item) => {
        return {
          updateOne: {
            filter: { _id: item.product_id },
            update: {
              $inc: {
                product_quantity: -item.quantity
              }
            }
          }
        }
      })
      const updateProduct = await this.Product.bulkWrite(updateData)
      const fineTuneItems = order.toObject().items.map((item) => {
        return {
          product_id: String(item.product_id),
          product_name: item.product_name,
          description: item.description,
          vendor: String(item.vendor),
          images: item.images,
          quantity: item.quantity,
          unit_price: item.unit_price,
          height: item.height,
          width: item.width,
          weight: item.weight,
          is_discounted: item.is_discounted,
          status: OrderStatus.BOOKED,
        }
      })
      this.createOrderDetails(
        fineTuneItems,
        user,
        order
      )

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "success",
        data: {
          completedOrder,
          updateProduct
        }
      }
      return responseData

    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }

  public async sendOrderToVendors(order_details: any[]): Promise<ResponseData> {
    let responseData: ResponseData = {
      status: StatusMessages.success,
      code: HttpCodes.HTTP_OK,
      message: "success",
      data: null
    }
    try {
      console.log("TIME TO SEND EMAILS OF ORDERS TO VENDORS");
      console.log("🚀 ~ OrderService ~ sendOrderToVendors ~ order_details:", order_details.length)

      const groupedItems = order_details.reduce((acc, item) => {
        const vendorId = String(item?.vendor)
        if (vendorId) {
          if (!acc[vendorId]) {
            acc[vendorId] = [];
          }
          acc[vendorId].push(item);
        }
        return acc;
      }, {} as { [vendor: string]: any[] })

      Object.keys(groupedItems).forEach(async vendor => {
        const vendorItems = groupedItems[vendor]
        if (vendorItems.length > 0) {
          const user = await this.User.findById(vendor)
          const emailPayload = {
            business_name: user?.FirstName,
            email: user?.Email,
            items: vendorItems
          }
          this.mailService.sendOrdersToVendor(emailPayload)

        }
      })
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ OrderService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }
  }
}

export default OrderService;