import mongoose, { Schema, model } from "mongoose";

const schema = new Schema(
	{
		FirstName: {
			type: String,
			required: true,
		},
		LastName: {
			type: String,
			required: true,
		},
		Email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		PhoneNumber: {
			type: String,
			unique: true,
			trim: true,
		},
		ProfileImage: {
			type: String,
		},
		Password: {
			type: String,
			required: true,
		},
		IsActive: {
			type: Boolean,
		},
		Role: {
			type: mongoose.Types.ObjectId,
			ref: "Roles",
		},
		Token: {
			type: String,
		},
	},
	{
		collection: "Admins",
		timestamps: true,
	}
);

export default model("Admins", schema);
