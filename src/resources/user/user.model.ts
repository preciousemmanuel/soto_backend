import mongoose, { Schema, model } from "mongoose";

import { User } from "@/resources/user/user.interface";
import {
	ProductStatus,
	SellerStatus,
	SignupChannels,
	UserRanks,
	UserTypes,
} from "@/utils/enums/base.enum";

const UserSchema = new Schema(
	{
		// userId: {
		//     type: Number,
		//     required: true,
		//     unique: true,
		//   },
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

		ProfileImage: {
			type: String,
		},

		Password: {
			type: String,
			required: true,
		},

		UserName: {
			type: String,
		},
		IsActive: {
			type: Boolean,
			default: true,
		},
		IsBlocked: {
			type: Boolean,
			default: false,
		},
		Role: {
			type: String,
		},
		Rank: {
			type: String,
			default: UserRanks.AMATEUR,
		},
		Token: {
			type: String,
		},
		PhoneNumber: {
			type: String,
		},
		UserType: {
			type: String,
			enum: UserTypes,
			default: UserTypes.USER,
		},
		fcmToken: {
			type: String,
		},
		playerId: {
			type: String,
		},
		ShippingAddress: {
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
		shipping_address_id: {
			type: String,
		},
		SignupChannel: {
			type: String,
			enum: SignupChannels,
			default: SignupChannels.DEFAULT,
		},
		IsVerified: {
			type: Boolean,
			default: false,
		},
		wallet: {
			type: mongoose.Types.ObjectId,
			ref: "Wallets",
		},

		business: {
			type: mongoose.Types.ObjectId,
			ref: "Businesses",
		},
		cart: {
			type: mongoose.Types.ObjectId,
			ref: "Carts",
		},
		card: {
			type: mongoose.Types.ObjectId,
			ref: "Cards",
		},
		coordinate: {
			type: [Number], // <lng, lat>
			index: { type: "2dsphere", sparse: false },
			default: [3.406448, 6.465422],
		},
		vendor_status: {
			type: String,
			enum: [
				SellerStatus.PENDING,
				SellerStatus.APPROVED,
				SellerStatus.DECLINED,
			],
			default: ProductStatus.PENDING,
		},
	},
	{
		collection: "Users",
		timestamps: true,
	}
);

// UserSchema.pre<User>("save",async function (next) {
//     if(!this.isModified) return next();

//     const hash=await bycrpt.hash(this.password,10);
//     this.password=hash;
//     next();
// })

// UserSchema.methods.isVaildPassword=async function(
//     password:string
// ):Promise<Error|boolean>{
// return await bycrpt.compare(password,this.password)
// }

export default model<User>("Users", UserSchema);
