import { Schema, model } from "mongoose";

import User from "@/resources/user/user.interface";




const UserSchema = new Schema({
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
  // PhoneNumber:{
  //     type:String
  // },
  // fcmToken:{
  //     type:String
  // },
  // playerId:{
  //     type:String
  // },

}, { collection: "Users" });

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