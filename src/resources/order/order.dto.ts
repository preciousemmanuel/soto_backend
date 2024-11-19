import {
  IdentificationTypes,
  OrderPaymentType,
  SignupChannels,
  UserTypes,
  YesOrNo
} from "@/utils/enums/base.enum";
import { orderItems } from "./order.interface";
import { OrderStatus } from "aws-sdk/clients/outposts";


export interface CreateOrderDto {
  items: orderItems[];
  shipping_address?: string;
  payment_type?: OrderPaymentType;
  checkout_with_cart: YesOrNo
}

export interface AddToCartDto {
  items: orderItems[];
}

export interface RemoveFromCartDto {
  product_id: string;
}

export interface FetchMyOrdersDto {
  limit?: number
  page?: number;
  filter?: FilterMyOrdersDto
}

export interface FilterMyOrdersDto {
  status?: OrderStatus;
  start_date?: string;
  end_date?: string;
}






