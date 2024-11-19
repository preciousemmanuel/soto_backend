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
const adminOverview_service_1 = __importDefault(require("../adminOverview/adminOverview.service"));
class UserController {
    constructor() {
        this.path = "/user";
        this.router = (0, express_1.Router)();
        this.userService = new user_service_1.default();
        this.adminOverviewService = new adminOverview_service_1.default();
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
                address.is_admin = false;
                address.user = req.user;
                const { status, code, message, data } = yield this.adminOverviewService.createShippingAddress(address);
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
        this.getVendorDashboard = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            try {
                const is_custom = ((_a = req === null || req === void 0 ? void 0 : req.query) === null || _a === void 0 ? void 0 : _a.start_date) !== null &&
                    ((_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.end_date) !== null &&
                    ((_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.start_date) !== undefined &&
                    ((_d = req === null || req === void 0 ? void 0 : req.query) === null || _d === void 0 ? void 0 : _d.end_date) !== undefined;
                const timeFrame = ((is_custom === false) &&
                    ((_e = req.query) === null || _e === void 0 ? void 0 : _e.time_frame) && (((_f = req.query) === null || _f === void 0 ? void 0 : _f.time_frame) !== null) && (((_g = req.query) === null || _g === void 0 ? void 0 : _g.time_frame) !== "")) ?
                    String((_h = req.query) === null || _h === void 0 ? void 0 : _h.time_frame) : undefined;
                const custom_date = (is_custom === true) ? {
                    start_date: new Date(String((_j = req === null || req === void 0 ? void 0 : req.query) === null || _j === void 0 ? void 0 : _j.start_date)),
                    end_date: new Date(String((_k = req === null || req === void 0 ? void 0 : req.query) === null || _k === void 0 ? void 0 : _k.end_date)),
                } : undefined;
                const user = req.user;
                const payload = Object.assign(Object.assign({ user }, (timeFrame && { timeFrame })), ((custom_date) && { custom: custom_date }));
                const { status, code, message, data } = yield this.userService.getVendorDashboard(payload);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.getVendorInventory = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const user = req.user;
                const payload = {
                    user,
                    limit: ((_a = req === null || req === void 0 ? void 0 : req.query) === null || _a === void 0 ? void 0 : _a.limit) ? Number((_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.limit) : 10,
                    page: ((_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.page) ? Number((_d = req === null || req === void 0 ? void 0 : req.query) === null || _d === void 0 ? void 0 : _d.page) : 1,
                };
                const { status, code, message, data } = yield this.userService.getVendorInventory(payload);
                return (0, http_response_1.responseObject)(res, code, status, message, data);
            }
            catch (error) {
                next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_BAD_REQUEST, error.toString()));
            }
        });
        this.getSalesAnalytics = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { status, code, message, data } = yield this.userService.getSalesAnalytics(user);
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
        this.newPasswordReset = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const new_password = req.body.new_password;
                const otp = req.body.otp;
                const { status, code, message, data } = yield this.userService.newPasswordReset(new_password, otp);
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
        this.router.get(`${this.path}/vendor-overview`, authenticated_middleware_1.default, this.getVendorDashboard);
        this.router.get(`${this.path}/vendor-inventory`, authenticated_middleware_1.default, this.getVendorInventory);
        this.router.get(`${this.path}/sales-analytics`, authenticated_middleware_1.default, this.getSalesAnalytics);
        this.router.post(`${this.path}/login`, (0, validation_middleware_1.default)(user_validation_1.default.userLoginSchema), this.userLogin);
        this.router.post(`${this.path}/change-password-request`, (0, validation_middleware_1.default)(user_validation_1.default.changePasswordRequest), this.changePasswordRequest);
        this.router.post(`${this.path}/validate-otp`, (0, validation_middleware_1.default)(user_validation_1.default.validateOtpSchema), this.validateOtp);
        this.router.put(`${this.path}/new-password`, authenticated_middleware_1.default, (0, validation_middleware_1.default)(user_validation_1.default.newPasswordSchema), this.newPasswordChange);
        this.router.put(`${this.path}/reset-password`, (0, validation_middleware_1.default)(user_validation_1.default.resetPasswordSchema), this.newPasswordReset);
    }
}
exports.default = UserController;
