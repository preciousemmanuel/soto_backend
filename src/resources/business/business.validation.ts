import {
	IdentificationTypes,
	SignupChannels,
	TransactionStatus,
	UserTypes,
} from "@/utils/enums/base.enum";
import { email } from "envalid";
import Joi from "joi";

const createBusinessSchema = Joi.object({
	business_name: Joi.string().required(),
	email: Joi.string().email().required(),
	phone_number: Joi.string().required(),
	password: Joi.string().required(),
	adress: Joi.string().required(),
	category: Joi.string().required(),
	description: Joi.string().optional(),
	business_logo: Joi.object({}).optional(),
});

const verifyBusinessSchema = Joi.object({
	verification_type: Joi.string()
		.valid(
			IdentificationTypes.BVN,
			IdentificationTypes.NIN,
			IdentificationTypes.DRIVERS_LICENSE,
			IdentificationTypes.INTERNATIONAL_PASSPORT,
			IdentificationTypes.VOTERS_CARD
		)
		.required(),
	verification_number: Joi.string().required(),
});

const addBankDetailsSchema = Joi.object({
	account_number: Joi.string().required(),
	bank_id: Joi.string().required(),
});

const makeWithdrawalSchema = Joi.object({
	amount: Joi.number().min(500).required(),
	bank_details_id: Joi.string().required(),
});

const modelIDSchema = Joi.object({
	id: Joi.string().required(),
});

const paginateSchema = Joi.object({
	limit: Joi.number().positive().default(10).optional(),
	page: Joi.number().positive().default(1).optional(),
	search: Joi.string().optional(),
	status: Joi.string()
		.valid(
			TransactionStatus.FAILED,
			TransactionStatus.PENDING,
			TransactionStatus.REVERSAL,
			TransactionStatus.SUCCESSFUL
		)
		.optional(),
});

export default {
	createBusinessSchema,
	verifyBusinessSchema,
	addBankDetailsSchema,
	makeWithdrawalSchema,
	modelIDSchema,
	paginateSchema,
};
