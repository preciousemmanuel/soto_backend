import {
	ApproveOrDecline,
	IdentificationTypes,
	SignupChannels,
	Timeline,
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

const modelIdSchema = Joi.object().keys({
	id: Joi.string().required(),
});

const completeWithdrawalApprovalSchema = Joi.object().keys({
	transfer_code: Joi.string().required(),
	otp: Joi.string().required(),
});

const DashboardOverviewSchema = Joi.object().keys({
	timeLine: Joi.string()
		.valid(
			Timeline.YESTERDAY,
			Timeline.TODAY,
			Timeline.LAST_7_DAYS,
			Timeline.THIS_MONTH,
			Timeline.LAST_6_MONTHS,
			Timeline.LAST_12_MONTHS,
			Timeline.THIS_YEAR,
			Timeline.LAST_2_YEARS
		)
		.allow(null)
		.allow("")
		.default(Timeline.THIS_MONTH)
		.optional(),
	limit: Joi.number().positive().optional(),
	page: Joi.number().positive().optional(),
	search: Joi.string().allow(null).allow("").optional(),
	status: Joi.string()
		.valid(
			TransactionStatus.FAILED,
			TransactionStatus.PENDING,
			TransactionStatus.REVERSAL,
			TransactionStatus.SUCCESSFUL
		)
		.allow(null)
		.allow("")
		.optional(),
});

const approveWithdrawalSchema = Joi.object().keys({
	approve_or_decline: Joi.string()
		.valid(ApproveOrDecline.APPROVED, ApproveOrDecline.DECLINED)
		.required(),
});

export default {
	createBusinessSchema,
	DashboardOverviewSchema,
	approveWithdrawalSchema,
	modelIdSchema,
	completeWithdrawalApprovalSchema,
};
