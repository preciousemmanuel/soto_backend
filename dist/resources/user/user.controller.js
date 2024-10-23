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
const http_response_1 = require("@/utils/helpers/http.response");
const httpcode_1 = require("@/utils/constants/httpcode");
const authenticated_middleware_1 = __importDefault(require("@/middleware/authenticated.middleware"));
class UserController {
    constructor() {
        this.path = "/user";
        this.router = (0, express_1.Router)();
        this.userService = new user_service_1.default();
        this.createUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const body = req.body;
                const { status, code, message, data } = yield this.userService.createUser(body);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.addShippingAddress = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const address = req.body;
                const user = req.user;
                const { status, code, message, data } = yield this.userService.addShippingAddress(address, user);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.getProfile = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { status, code, message, data } = yield this.userService.getProfile(user);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.userLogin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = req.body;
                const { status, code, message, data } = yield this.userService.userLogin(payload);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.changePasswordRequest = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = req.body;
                const { status, code, message, data } = yield this.userService.changePasswordRequest(payload);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.validateOtp = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const otp = req.body.otp;
                const { status, code, message, data } = yield this.userService.validateOtp(otp, req.body.otp_purpose);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.newPasswordChange = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const new_password = req.body.new_password;
                const user = req.user;
                const { status, code, message, data } = yield this.userService.newPasswordChange(new_password, user);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
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
        this.router.post(`${this.path}/fcm`, authenticated_middleware_1.default, (0, validation_middleware_1.default)(user_validation_1.default.updateFcm), this.updateFcmToken),
            this.router.post(`${this.path}/signup`, (0, validation_middleware_1.default)(user_validation_1.default.signupSchema), this.createUser);
        this.router.put(`${this.path}/add-shipping-address`, authenticated_middleware_1.default, (0, validation_middleware_1.default)(user_validation_1.default.addShippingAddressSchema), this.addShippingAddress);
        this.router.get(`${this.path}/profile`, authenticated_middleware_1.default, this.getProfile);
        this.router.post(`${this.path}/login`, (0, validation_middleware_1.default)(user_validation_1.default.userLoginSchema), this.userLogin);
        this.router.post(`${this.path}/change-password-request`, (0, validation_middleware_1.default)(user_validation_1.default.changePasswordRequest), this.changePasswordRequest);
        this.router.post(`${this.path}/validate-otp`, (0, validation_middleware_1.default)(user_validation_1.default.validateOtpSchema), this.validateOtp);
        this.router.put(`${this.path}/new-password`, authenticated_middleware_1.default, (0, validation_middleware_1.default)(user_validation_1.default.newPasswordSchema), this.newPasswordChange);
    }
}
exports.default = UserController;
