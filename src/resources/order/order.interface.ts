import {
  IdentificationTypes,
} from "@/utils/enums/base.enum";
import mongoose, { Document } from "mongoose";

export interface Order extends Document {
  items: orderItems[];
  shipping_address?: string;
}

export interface orderItems {
  product_id: string;
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

export interface ItemInCart extends Document {
  product_id: mongoose.Types.ObjectId;  // References Products model
  product_name: string;
  description: string;
  vendor?: mongoose.Types.ObjectId;     // References Users model (optional)
  images?: string[];                    // Optional array of strings
  quantity: number;
  unit_price: number;
  is_discounted?: boolean;              // Optional, defaults to false
}