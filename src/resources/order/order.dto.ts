import {
  IdentificationTypes,
  OrderPaymentType,
  SignupChannels,
  UserTypes
} from "@/utils/enums/base.enum";
import { orderItems } from "./order.interface";
import { OrderStatus } from "aws-sdk/clients/outposts";


export interface CreateOrderDto {
  items: orderItems[];
  shipping_address?: string;
  payment_type?: OrderPaymentType;
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






