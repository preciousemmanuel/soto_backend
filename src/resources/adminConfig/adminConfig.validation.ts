import { IdentificationTypes, YesOrNo } from "@/utils/enums/base.enum";
import Joi from "joi";

const adminLoginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

const modelIdSchema = Joi.object({
	id: Joi.string().required(),
});

const editSettingsSchema = Joi.object({
	address: Joi.string().optional(),
	city: Joi.string().optional(),
	state: Joi.string().optional(),
	postal_code: Joi.string().optional(),
	withdrawals_manual: Joi.string().valid(YesOrNo.NO, YesOrNo.YES).optional(),
	withdrawals_scheduled: Joi.string().valid(YesOrNo.NO, YesOrNo.YES).optional(),
	withdrawals_frequency: Joi.number().min(0).optional(),
	interest_rates_flat: Joi.number().min(0).optional(),
	interest_rates_special: Joi.number().min(0).optional(),
});

const updateStaffRoleSchema = Joi.object({
	role_id: Joi.string().required(),
});

const adminCreateSchema = Joi.object({
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	email: Joi.string().email().required(),
	phone_number: Joi.string().optional(),
	role: Joi.string().required(),
	address: Joi.string().required(),
	city: Joi.string().required(),
	postal_code: Joi.string().optional(),
	state: Joi.string().required(),
	country: Joi.string().required(),
});

const adminPurchaserSchema = Joi.object({
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	email: Joi.string().email().required(),
	phone_number: Joi.string().optional(),
	address: Joi.string().required(),
	city: Joi.string().required(),
	state: Joi.string().required(),
	country: Joi.string().optional(),
	id_type: Joi.string()
		.valid(
			IdentificationTypes.BVN,
			IdentificationTypes.DRIVERS_LICENSE,
			IdentificationTypes.INTERNATIONAL_PASSPORT,
			IdentificationTypes.NIN,
			IdentificationTypes.VOTERS_CARD
		)
		.required(),
	postal_code: Joi.string().optional(),
	id_number: Joi.string().required(),
	passport: Joi.object({}).optional(),
	password: Joi.string().required(),
});

const editProfileSchema = Joi.object({
	first_name: Joi.string().optional(),
	last_name: Joi.string().optional(),
	email: Joi.string().email().optional(),
	phone_number: Joi.string().optional(),
	password: Joi.string().optional(),
	address: Joi.string().optional(),
	city: Joi.string().optional(),
	postal_code: Joi.string().optional(),
	state: Joi.string().optional(),
	country: Joi.string().optional(),
	profile_image: Joi.object({}).optional(),
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

const UpdateAdminRoleSchema = Joi.object().keys({
	name: Joi.string(),
	admin: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
	config: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
	order: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
	buyer: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
	seller: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
	product: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
	transaction: Joi.object()
		.keys({
			read: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
			write: Joi.string().valid(YesOrNo.YES, YesOrNo.NO),
		})
		.optional(),
});

export default {
	adminLoginSchema,
	modelIdSchema,
	paginationSchema,
	CreateAdminRoleSchema,
	UpdateAdminRoleSchema,
	adminCreateSchema,
	updateStaffRoleSchema,
	editProfileSchema,
	editSettingsSchema,
	adminPurchaserSchema,
};
