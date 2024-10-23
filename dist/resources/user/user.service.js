"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("./user.model"));
const token_1 = require("@/utils/helpers/token");
const token_2 = require("@/utils/helpers/token");
const base_enum_1 = require("@/utils/enums/base.enum");
const httpcode_1 = require("@/utils/constants/httpcode");
const wallet_model_1 = __importDefault(require("../business/wallet.model"));
class UserService {
    constructor() {
        this.user = user_model_1.default;
        this.wallet = wallet_model_1.default;
    }
    createUser(createUser) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const userExist = yield this.user.findOne({
                    $or: [
                        { Email: createUser.Email.toLowerCase() },
                        { PhoneNumber: createUser.PhoneNumber },
                    ]
                });
                if (userExist) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "User With These Details Already Exists",
                    };
                }
                else {
                    const full_name_split = createUser.FullName.split(" ");
                    const hashedPassword = yield (0, token_2.hashPassword)(createUser.Password);
                    const createdUser = yield this.user.create({
                        FirstName: full_name_split.length > 0 ? full_name_split[0].toLowerCase() : "",
                        LastName: full_name_split.length > 1 ? full_name_split[1].toLowerCase() : "",
                        Email: createUser.Email.toLowerCase(),
                        PhoneNumber: createUser.PhoneNumber,
                        Password: hashedPassword,
                        SignupChannel: createUser === null || createUser === void 0 ? void 0 : createUser.SignupChannel,
                        UserType: createUser === null || createUser === void 0 ? void 0 : createUser.UserType,
                    });
                    const token = (0, token_1.createToken)(createdUser);
                    const wallet = yield this.wallet.create({
                        user: createdUser._id
                    });
                    createdUser.Token = token;
                    createdUser.wallet = wallet._id;
                    yield createdUser.save();
                    responseData = {
                        status: base_enum_1.StatusMessages.success,
                        code: httpcode_1.HttpCodes.HTTP_CREATED,
                        message: "User Created Successfully",
                        data: createdUser
                    };
                }
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    addShippingAddress(addShippingAddress, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                user.ShippingAddress = {
                    full_address: addShippingAddress.address,
                    country: "Nigeria"
                };
                yield user.save();
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Shipping Address Added Successfully",
                    data: user
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    getProfile(user) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Profile Retreived Successfully",
                    data: user
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ getProfile ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    userLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const user = yield this.user.findOne({
                    $or: [
                        {
                            Email: login.email_or_phone_number.toLowerCase(),
                            UserType: login.userType
                        },
                        {
                            PhoneNumber: login.email_or_phone_number.toLowerCase(),
                            UserType: login.userType
                        }
                    ]
                })
                    .populate('business')
                    .populate('wallet');
                if (!user) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "Incorrect Username Or Password"
                    };
                    return responseData;
                }
                const isPasswordCorrect = yield (0, token_1.comparePassword)(login.password, user === null || user === void 0 ? void 0 : user.Password);
                if (isPasswordCorrect === false) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "Incorrect Username Or Password"
                    };
                    return responseData;
                }
                const token = (0, token_1.createToken)(user);
                user.Token = token;
                yield user.save();
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "User Login Successful",
                    data: user
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    changePasswordRequest(changePasswordDto) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const user = yield this.user.findOne({
                    $or: [
                        {
                            Email: changePasswordDto.email_or_phone_number.toLowerCase(),
                        },
                        {
                            PhoneNumber: changePasswordDto.email_or_phone_number.toLowerCase(),
                        }
                    ]
                });
                if (!user) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "User Not Found"
                    };
                    return responseData;
                }
                const oneTimePassword = yield (0, token_1.generateOtpModel)(base_enum_1.OtpPurposeOptions.CHANGE_PASSWORD, user, user === null || user === void 0 ? void 0 : user.Email);
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Otp Generated Successfully",
                    data: oneTimePassword
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    validateOtp(otp, otp_purpose) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const otpValiationResponse = yield (0, token_1.isOtpCorrect)(otp, otp_purpose);
                return otpValiationResponse;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    newPasswordChange(new_password, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const hashed_password = yield (0, token_2.hashPassword)(new_password);
                user.Password = hashed_password;
                yield user.save();
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Password Changed Successflly",
                    data: user
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString()
                };
                return responseData;
            }
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.user.findOne({ userId: id }).select("-passwword");
                if (user) {
                    return user;
                }
                return null;
                // throw new Error("user does not exist");
            }
            catch (error) {
                console.log("notforur", error);
                throw new Error(error.toString());
            }
        });
    }
    updateFcmToken(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.user.findOneAndUpdate({ userId }, {
                    fcmToken: token
                }, { new: true });
                return data;
            }
            catch (error) {
                console.log("dsdsddsad", error);
                //logger.log("error",`cannotcreateusername ${JSON.stringify(error)}`);
                throw new Error("unable to update fcmtoken");
            }
        });
    }
}
exports.default = UserService;
