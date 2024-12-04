import { orderItems } from "../order/order.interface";
import userModel from "../user/user.model";

export interface GetDeliveryRateDto {
	delivery_address: string;
	parcel_id: string;
}

export interface GetCitiesDto {
	country_code: string;
	state_code?: string;
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
	delivery_details: DeliveryDetailsDto;
}

export interface GetShippingPriceAgilityDto {
	PreShipmentMobileId: any;
	SenderName: any;
	SenderPhoneNumber: any;
	SenderStationId: any;
	InputtedSenderAddress: any;
	SenderLocality: any;
	ReceiverStationId: any;
	SenderAddress: any;
	ReceiverName: any;
	ReceiverPhoneNumber: any;
	ReceiverAddress: any;
	InputtedReceiverAddress: any;
	SenderLocation: any;
	ReceiverLocation: any;
	PreShipmentItems: any;
	VehicleType: any;
	IsBatchPickUp: any;
	WaybillImage: any;
	WaybillImageFormat: any;
	DestinationServiceCenterId: any;
	DestinationServiceCentreId: any;
	IsCashOnDelivery: any;
	CashOnDeliveryAmount: any;
}

export interface GetPriceViaAgilityDto {
	items: orderItems[];
	shipping_address?: string;
}
