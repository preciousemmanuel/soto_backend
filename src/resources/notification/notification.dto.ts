import {
	NotificationCategory,
	ReadAndUnread,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import userModel from "../user/user.model";
import notificationModel from "./notification.model";

export interface CreateNotificationDto {
	sender?: string;
	receiver: string;
	type?: string;
	category?: NotificationCategory;
	category_id?: string;
	status?: boolean;
	title?: string;
	content: string;
	image?: string;
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
	existing_images?: string[];
}

export interface OneSignalPushNotificationDto {
	message: any;
	playerId: string;
	heading: string;
	imageUrl?: string;
}

export interface FirebasePushNotificationDto {
	message: any;
	fcmToken: string;
	heading: string;
	imageUrl?: string;
}

export interface AddFcmTokenOrPlayerIdDto {
	user_id: string;
	fcmToken?: string;
	playerId?: string;
}

export interface FilterProductsDto {
	product_name?: string;
	category?: string;
	price_upper?: number;
	price_lower?: number;
	rating?: number;
}

export interface WriteReviewDto {
	product_id: string;
	rating?: number;
	comment?: string;
}

export interface FetchNotificationsDto {
	user?: InstanceType<typeof userModel> | undefined | null;
	type?: string;
	search?: string;
	limit: number;
	page: number;
}

export interface SendSmsNotificationDto {
	from: string;
	to: string;
	body: string;
}

export interface SmsDto extends SendSmsNotificationDto {
	append_sender?: string;
	api_token: string;
	callback_url?: string;
	customer_reference?: string;
}
