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
const http_exception_1 = __importDefault(require("@/utils/exceptions/http.exception"));
const token_1 = require("@/utils/helpers/token");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticatedMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bearer = req.headers.authorization || "Bearer abcdef";
            console.log("🚀 ~ bearer:", bearer);
            if (!bearer || !bearer.startsWith("Bearer ")) {
                if (!req.path.includes("/product/fetch") &&
                    !req.path.includes("/order/create-custom")) {
                    return next(new http_exception_1.default(401, "Unauthorized"));
                }
                return next(); // Allow through for `/product/fetch`
            }
            const accessToken = bearer.split("Bearer ")[1].trim();
            const productPath = req.path.includes("/product/fetch");
            console.log("🚀 ~ productPath:", productPath);
            const payload = yield (0, token_1.verifyToken)(accessToken);
            if (payload instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                if (!productPath) {
                    return next(new http_exception_1.default(401, "Unauthorized"));
                }
                return next(); // Allow through for `/product/fetch`
            }
            const user = yield user_model_1.default
                .findById(payload.id)
                .populate("business")
                .populate("wallet")
                .populate("cart")
                .populate("card");
            if (!user && !productPath) {
                return next(new http_exception_1.default(401, "Unauthorized"));
            }
            req.user = user;
            next();
        }
        catch (error) {
            console.log("🚀authenticatedMiddleware ~ error:", error);
            if (!req.path.includes("/product/fetch")) {
                return next(new http_exception_1.default(401, "Unauthorized"));
            }
            next(); // Allow through for `/product/fetch` on error
        }
    });
}
exports.default = authenticatedMiddleware;
