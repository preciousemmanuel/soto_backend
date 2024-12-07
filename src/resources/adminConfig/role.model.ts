import mongoose, { Schema, model } from "mongoose";
import { YesOrNo } from "@/utils/enums/base.enum";
import { required } from "joi";

const schema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		alias: {
			type: String,
			unique: true,
			required: true,
			default: "STO",
		},
		admin: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		config: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		order: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		buyer: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		seller: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		product: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		transaction: {
			read: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
			write: {
				type: String,
				enum: [YesOrNo.NO, YesOrNo.YES],
				default: YesOrNo.NO,
			},
		},
		created_by: {
			type: mongoose.Types.ObjectId,
			ref: "Admins",
		},
	},
	{
		collection: "Roles",
		timestamps: true,
	}
);

export default model("Roles", schema);
