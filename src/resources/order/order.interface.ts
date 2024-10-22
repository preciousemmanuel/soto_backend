import {
  IdentificationTypes,
} from "@/utils/enums/base.enum";
import { Document } from "mongoose";

export interface Order extends Document {
  items: orderItems[];
  shipping_address?: string;
}

export interface orderItems {
  _id: string;
  quantity: number,
}

export interface itemsToBeOrdered {
  product_id: string;
  product_name: string;
  description: string;
  vendor: string;
  images: string[];
  quantity: number;
  unit_price: number;
  is_discounted?: boolean;
}