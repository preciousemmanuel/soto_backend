import { Schema, model } from "mongoose";

import { User } from "@/resources/user/user.interface";
import { SignupChannels, UserTypes } from "@/utils/enums/base.enum";




const UserSchema = new Schema(
  {
    // userId: {
    //     type: Number,
    //     required: true,
    //     unique: true,
    //   },
    FirstName: {
      type: String,
      required: true
    },
    LastName: {
      type: String,
      required: true
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    Password: {
      type: String,
      required: true,
    },

    UserName: {
      type: String
    },
    IsActive: {
      type: Boolean
    },
    Role: {
      type: String
    },
    Token: {
      type: String
    },
    PhoneNumber: {
      type: String
    },
    UserType: {
      type: String,
      enum: UserTypes,
      default: UserTypes.USER
    },
    // fcmToken:{
    //     type:String
    // },
    // playerId:{
    //     type:String
    // },
    ShippingAddress: {
      full_address: String,
      address: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: "Nigeria"
      }
    },
    SignupChannel: {
      type: String,
      enum: SignupChannels,
      default: SignupChannels.DEFAULT
    }

  },
  {
    collection: "Users",
    timestamps: true
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