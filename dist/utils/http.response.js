"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseObject = void 0;
const responseObject = (response, code, status, message, data) => {
    if (!data) {
        return response.status(code).json({
            status,
            message,
        });
    }
    else {
        return response.status(code).json({
            status,
            // resultCount: data ? data.length : 0,
            data,
            message,
        });
    }
};
exports.responseObject = responseObject;
exports.default = { responseObject: exports.responseObject };
