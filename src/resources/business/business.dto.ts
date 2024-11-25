import {
	IdentificationTypes,
	SignupChannels,
	UserTypes,
} from "@/utils/enums/base.enum";
import userModel from "../user/user.model";
import { TransactionStatus } from "aws-sdk/clients/rdsdataservice";

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

export interface AddBankDetailsDto {
	user: InstanceType<typeof userModel>;
	account_number: string;
	bank_id: string;
}

export interface FetchBanksDto {
	limit: number;
	page: number;
	search?: string;
}

export interface MakeWithdrawalDto {
	user: InstanceType<typeof userModel>;
	amount: number;
	bank_details_id: string;
}

export interface FetchWithdrawalsDto {
	user: InstanceType<typeof userModel>;
	limit: number;
	page: number;
	status?: TransactionStatus;
}
