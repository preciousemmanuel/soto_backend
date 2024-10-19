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
const user_model_1 = __importDefault(require("@/resources/user/user.model"));
class UserService {
    constructor() {
        this.user = user_model_1.default;
    }
    createUser(createUser) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //do some checkings
                console.log("dsdoiuueuuew", createUser);
                const userExist = yield this.user.findOne({ userId: createUser.userId });
                console.log("doduhd", userExist);
                if (userExist) {
                    return true;
                }
                const createdUser = yield this.user.create(createUser);
                return true;
            }
            catch (error) {
                return false;
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
