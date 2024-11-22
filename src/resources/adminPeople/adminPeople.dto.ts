import {
	IdentificationTypes,
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
	advanced_report_timeline?: backDaterArray[];
	search?: string;
}

export interface UpdateUserByAdminDto {
	first_name?: string;
	last_name?: string;
	email?: string;
	password?: string;
	phone_number?: string;
	is_blocked?: YesOrNo;
	is_verified?: YesOrNo;
	is_active?: YesOrNo;
}
