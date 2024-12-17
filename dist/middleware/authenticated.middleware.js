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
        const productPath = req.path.includes("/product/fetch");
        const customOrderPath = req.path.includes("/order/create-custom");
        try {
            const bearer = req.headers.authorization || "Bearer abcdef";
            if (!bearer || !bearer.startsWith("Bearer ")) {
                if (productPath === false && customOrderPath === false) {
                    return next(new http_exception_1.default(401, "Unauthorized"));
                }
                else {
                    return next();
                }
            }
            const accessToken = bearer.split("Bearer ")[1].trim();
            const payload = accessToken !== "abcdef" ? yield (0, token_1.verifyToken)(accessToken) : undefined;
            if (payload && payload instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                if (productPath === false && customOrderPath === false) {
                    return next(new http_exception_1.default(401, "Unauthorized"));
                }
                console.log("still allow");
                return next(); // Allow through for `/product/fetch`
            }
            else {
                const user = yield user_model_1.default
                    .findById(payload === null || payload === void 0 ? void 0 : payload.id)
                    .populate("business")
                    .populate("wallet")
                    .populate("cart")
                    .populate("card");
                if (!user && !productPath && !customOrderPath) {
                    return next(new http_exception_1.default(401, "Unauthorized"));
                }
                req.user = user;
                next();
            }
        }
        catch (error) {
            console.log("🚀authenticatedMiddleware ~ error:", error);
            if (productPath === false && customOrderPath === false) {
                return next(new http_exception_1.default(401, "Unauthorized"));
            }
            next(); // Allow through for `/product/fetch` on error
        }
    });
}
exports.default = authenticatedMiddleware;
