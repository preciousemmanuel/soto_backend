"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const base_enum_1 = require("@/utils/enums/base.enum");
const UserSchema = new mongoose_1.Schema({
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
        enum: base_enum_1.UserTypes,
        default: base_enum_1.UserTypes.USER
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
        postal_code: String,
        country: {
            type: String,
            default: "Nigeria"
        }
    },
    SignupChannel: {
        type: String,
        enum: base_enum_1.SignupChannels,
        default: base_enum_1.SignupChannels.DEFAULT
    },
    IsVerified: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Wallets"
    },
    business: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Businesses"
    },
    cart: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Carts"
    }
}, {
    collection: "Users",
    timestamps: true
});
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
exports.default = (0, mongoose_1.model)("Users", UserSchema);
