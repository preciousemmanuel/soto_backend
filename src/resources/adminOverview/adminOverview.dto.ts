import {
	IdentificationTypes,
	ProductStatus,
	PromoTypes,
	SignupChannels,
	Timeline,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import { backDaterArray } from "@/utils/interfaces/base.interface";

export interface CreateBusinessDto {
	business_name: string;
	email: string;
	password: string;
	phone_number: string;
	adress: string;
	category?: string;
	description?: string;
	business_logo?: Express.Multer.File;
}

export interface UpdateBusinessDto extends Partial<CreateBusinessDto> {}

export interface VerificationDto {
	verification_type: IdentificationTypes;
	verification_number: string;
}

export interface OverviewDto {
	start_date?: string | Date;
	end_date?: string | Date;
	previous_start_date?: string | Date;
	previous_end_date?: string | Date;
	timeLine?: Timeline;
	limit?: string | number;
	page?: string | number;
	advanced_report_timeline?: backDaterArray;
}

export interface UpdateCustomOrderDto {
	order_id: string;
	decline_note?: string;
	approve_or_decline: ProductStatus;
}

export interface CreateCouponDto {
	name: string;
	coupon_type: PromoTypes;
	amount: number;
	applied_to: UserTypes;
	activation_date: string;
	expiry_date: string;
	remove_expiry_date?: YesOrNo;
	usage_limit?: number;
	remove_usage_limit?: YesOrNo;
}

export interface CreateCouponDiscountDto {
	quantity: number;
	discount: number;
	activation_date: string;
	expiry_date: string;
	product_category?: string;
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {
	active_status?: YesOrNo;
}

export interface paginateDto {
	limit?: number;
	page?: number;
	start_date?: Date;
	end_date?: Date;
	search?: string;
}
export interface createCategoryDto {
	name: string;
	image?: Express.Multer.File;
}
