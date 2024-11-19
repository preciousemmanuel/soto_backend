import { YesOrNo } from "@/utils/enums/base.enum";
import Joi from "joi";

const adminLoginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

const modelIdSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

const adminCreateSchema = Joi.object({
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	email: Joi.string().email().required(),
	phone_number: Joi.string().optional(),
});

const paginationSchema = Joi.object().keys({
	search: Joi.string().allow(null).allow("").optional(),
	role: Joi.string().allow(null).allow("").optional(),
	limit: Joi.number().positive().default(10).optional(),
	page: Joi.number().positive().default(1).optional(),
});

const CreateAdminRoleSchema = Joi.object().keys({
	name: Joi.string().required(),
	admin: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
	config: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
	order: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
	buyer: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
	seller: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
	product: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
	transaction: Joi.object().keys({
		read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
		write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO).required(),
	}),
});

export default {
	adminLoginSchema,
	modelIdSchema,
	paginationSchema,
	CreateAdminRoleSchema,
	adminCreateSchema,
};
