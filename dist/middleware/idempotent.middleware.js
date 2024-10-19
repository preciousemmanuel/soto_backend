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
const http_exception_1 = __importDefault(require("@/utils/exceptions/http.exception"));
const httpcode_1 = require("@/utils/httpcode");
function idempotentMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const idempotentKey = req.headers.idempotentkey;
        if (!idempotentKey) {
            // return res.status(401).json({error:"Unauthorized"});
            return next(new http_exception_1.default(httpcode_1.HttpCodes.HTTP_FORBIDDEN, "Please provide unique idempotentKey key"));
        }
        next();
    });
}
exports.default = idempotentMiddleware;
