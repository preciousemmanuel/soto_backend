import {
	IdentificationTypes,
	SignupChannels,
	Timeline,
	UserTypes,
} from "@/utils/enums/base.enum";
import {
	backDaterArray,
	ReadWriteDto,
} from "@/utils/interfaces/base.interface";
import adminModel from "./admin.model";

export interface EditSettingsDto {
	address?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	withdrawals_manual?: string;
	withdrawals_scheduled?: string;
	withdrawals_frequency?: number;
	interest_rates_flat?: number;
	interest_rates_special?: number;
}

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

export interface AdminLoginDto {
	email: string;
	password: string;
}

export interface CreateAdminDto {
	first_name: string;
	last_name: string;
	email: string;
	phone_number?: string;
	role: string;
	address: string;
	city: string;
	postal_code?: string;
	state: string;
	country: string;
}

export interface CreatePurchaserDto {
	first_name: string;
	last_name: string;
	email: string;
	phone_number?: string;
	address: string;
	city: string;
	state?: string;
	country?: string;
	id_type: string;
	id_number: string;
	passport: Express.Multer.File;
	password: string;
}

export interface UpdateAdminProfileDto extends Partial<CreateAdminDto> {
	password?: string;
	profile_image?: Express.Multer.File;
}

export interface CreateRoleDto {
	name: string;
	admin: ReadWriteDto;
	config: ReadWriteDto;
	order: ReadWriteDto;
	buyer: ReadWriteDto;
	seller: ReadWriteDto;
	product: ReadWriteDto;
	transaction: ReadWriteDto;
	created_by?: string;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export interface AddStaffAddressDto {
	admin: InstanceType<typeof adminModel>;
	address: string;
	city: string;
	postal_code?: string;
	state: string;
	country?: string;
}
