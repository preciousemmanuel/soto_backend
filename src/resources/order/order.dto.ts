import {
	IdentificationTypes,
	OrderPaymentType,
	SignupChannels,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import { orderItems } from "./order.interface";
import { OrderStatus } from "aws-sdk/clients/outposts";
import userModel from "../user/user.model";

export interface CreateOrderDto {
	items: orderItems[];
	shipping_address?: string;
	payment_type?: OrderPaymentType;
	checkout_with_cart: YesOrNo;
	coupon_code?: string;
}

export interface CreateCustomOrderDto {
	product_name: string;
	product_brand?: string;
	size?: string;
	color?: string;
	type?: string;
	quantity: number;
	max_price: number;
	min_price: number;
	phone_number: string;
	email: string;
	note?: string;
	user?: InstanceType<typeof userModel>;
}

export interface CustomOrderArrayDto {
	orders: CreateCustomOrderDto[];
}

export interface AddToCartDto {
	items: orderItems[];
}

export interface RemoveFromCartDto {
	product_id: string;
}

export interface FetchMyOrdersDto {
	limit?: number;
	page?: number;
	filter?: FilterMyOrdersDto;
}

export interface FilterMyOrdersDto {
	status?: OrderStatus;
	start_date?: string;
	end_date?: string;
}
