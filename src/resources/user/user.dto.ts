import { SignupChannels, UserTypes } from "@/utils/enums/base.enum";
import userModel from "./user.model";

export interface CreateUserDto {
	FullName: string;
	Email: string;
	UserName?: string;
	IsActive?: boolean;
	Role?: string;
	PhoneNumber: string;
	fcmToken?: string;
	playerId?: string;
	Password: string;
	SignupChannel?: SignupChannels;
	UserType: UserTypes;
}

export interface AddShippingAddressDto {
	user: InstanceType<typeof userModel>;
	is_admin?: boolean;
	address: string;
	city: string;
	postal_code?: string;
	state: string;
	country?: string;
}

export interface LoginDto {
	email_or_phone_number: string;
	password: string;
	userType: UserTypes;
}

export interface ChangePasswordDto {
	email_or_phone_number: string;
}

export interface vendorDashboardDto {
	user: InstanceType<typeof userModel>;
	timeFrame?: string;
	custom?: customDateDto;
}

export interface customDateDto {
	start_date: Date;
	end_date: Date;
}

export interface vendorInventoryDto {
	user: InstanceType<typeof userModel>;
	limit: number;
	page: number;
}
