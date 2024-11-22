import {
	IdentificationTypes,
	OrderStatus,
	SignupChannels,
	Timeline,
	UserTypes,
} from "@/utils/enums/base.enum";
import { email } from "envalid";
import Joi from "joi";
import OrderService from "../order/order.service";
import mongoose from "mongoose";

const modelIdSchema = Joi.object({
	id: Joi.string().required(),
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
	purchaser: Joi.string()
		// .custom((value, helpers) => {
		// 	if (!mongoose.Types.ObjectId.isValid(value)) {
		// 		return helpers.error("any.invalid");
		// 	}
		// 	return value;
		// })
		.optional(),
	status: Joi.string()
		.valid(
			OrderStatus.PENDING,
			OrderStatus.PICKED_UP,
			OrderStatus.DELIVERED,
			OrderStatus.CANCELLED
		)
		.allow(null)
		.allow("")
		.optional(),
});

export default {
	modelIdSchema,
	DashboardOverviewSchema,
};
