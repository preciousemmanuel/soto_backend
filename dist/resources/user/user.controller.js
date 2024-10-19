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
const express_1 = require("express");
const http_exception_1 = __importDefault(require("@/utils/exceptions/http.exception"));
const validation_middleware_1 = __importDefault(require("@/middleware/validation.middleware"));
const user_service_1 = __importDefault(require("@/resources/user/user.service"));
const user_validation_1 = __importDefault(require("./user.validation"));
const http_response_1 = require("@/utils/http.response");
const httpcode_1 = require("@/utils/httpcode");
const authenticated_middleware_1 = __importDefault(require("@/middleware/authenticated.middleware"));
class UserController {
    constructor() {
        this.path = "/user";
        this.router = (0, express_1.Router)();
        this.userService = new user_service_1.default();
        this.updateFcmToken = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = 1;
                const { token } = req.body;
                const data = yield this.userService.updateFcmToken(userId, token);
                return (0, http_response_1.responseObject)(res, httpcode_1.HttpCodes.HTTP_OK, "success", "Update fcm token Successfull", data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.message));
            }
        });
        this.initializeRoute();
    }
    initializeRoute() {
        this.router.post(`${this.path}/fcm`, authenticated_middleware_1.default, (0, validation_middleware_1.default)(user_validation_1.default.updateFcm), this.updateFcmToken);
    }
}
exports.default = UserController;
