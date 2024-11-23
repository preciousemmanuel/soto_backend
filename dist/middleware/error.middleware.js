"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_response_1 = require("@/utils/helpers/http.response");
function errorMiddleware(error, req, res, next) {
    const status = error.status || 500;
    const message = error.message || "Something went wrong";
    (0, http_response_1.responseObject)(res, status, "error", message);
    // res.status(status).send(message);
}
exports.default = errorMiddleware;
