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
			required: true,
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
		id_type: {
			type: String,
		},
		id_number: {
			type: String,
		},
		address_details: {
			full_address: String,
			address: String,
			city: String,
			state: String,
			postal_code: String,
			address_id: String,
			coordinates: {
				lat: Number,
				lng: Number,
			},
			country: {
				type: String,
				default: "Nigeria",
			},
		},
		address_id: {
			type: String,
		},
		coordinate: {
			type: [Number], // <lng, lat>
			index: { type: "2dsphere", sparse: false },
			default: [3.406448, 6.465422],
		},
	},
	{
		collection: "Admins",
		timestamps: true,
	}
);

export default model("Admins", schema);
