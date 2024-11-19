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
