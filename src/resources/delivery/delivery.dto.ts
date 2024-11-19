import userModel from "../user/user.model";

export interface GetDeliveryRateDto {
  delivery_address: string;
  parcel_id: string,
}

export interface GetCitiesDto {
  country_code: string;
  state_code?: string,
}

export interface DeliveryDetailsDto {
  parcel: string;
  rate_id: string;
  user: string;
  _id: string;
  carrier_reference: string;
  amount: number;
  carrier_name: string;
  carrier_rate_description: string;
  carrier_slug: string;
  delivery_time: string;
  delivery_address: string;
}

export interface DeliveryOptionDto {
  user: InstanceType<typeof userModel>;
  order_id: string;
  delivery_details: DeliveryDetailsDto
}



