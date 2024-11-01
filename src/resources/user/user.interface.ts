import { UserTypes } from "@/utils/enums/base.enum";
import mongoose, { Document } from "mongoose";

export interface User extends Document {
  // userId:number,
  FirstName: string;
  LastName: string;
  Email: string;
  UserName?: string;
  IsActive: boolean;
  Role: string;
  Token: string;
  PhoneNumber: string;
  Password: string;
  SignupChannel?: string;
  ShippingAddress?: ShippingAddress;
  UserType?: UserTypes;
  Isverified?: Boolean;
  wallet?: mongoose.Types.ObjectId;
  business?: mongoose.Types.ObjectId;
  cart?: mongoose.Types.ObjectId;
  // fcmToken?:string;
  // playerId?:string;
}

export interface ShippingAddress {
  full_address?: string,
  address?: string,
  city?: string,
  state?: string,
  country?: string
}