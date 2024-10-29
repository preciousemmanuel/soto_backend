import {
  UserTypes,
  YesOrNo
} from "@/utils/enums/base.enum";

export interface AddProductDto {
  product_name: string;
  description: string;
  category: string;
  unit_price: number;
  product_quantity: number;
  discount_price?: number;
  in_stock: YesOrNo;
  images?: Express.Multer.File[]
}

export interface UpdateProductDto {
  product_id?: string;
  product_name?: string;
  description?: string;
  category?: string;
  unit_price?: number;
  product_quantity?: number;
  discount_price?: number;
  in_stock?: YesOrNo;
  images?: Express.Multer.File[];
  existing_images?: string[]

}

export interface FetchProductsDto {
  limit?: number
  page?: number;
  filter?: FilterProductsDto

}

export interface FilterProductsDto {
  product_name?: string;
  category?: string;
  price_upper?: number;
  price_lower?: number;
}

export interface WriteReviewDto {
  product_id: string;
  rating?: number;
  comment?: string;

}




