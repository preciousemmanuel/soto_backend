"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardType = exports.currency = exports.status = void 0;
const status = {
    ACTIVE: "ACTIVE",
    PENDING: "PENDING",
    FAILED: "FAILED",
    SUCCESS: "SUCCESS",
    INACTIVE: "INACTIVE",
    BLOCKED: "BLOCKED",
    APPROVE: "APPROVE",
    DECLINED: "DECLINED",
};
exports.status = status;
const currency = {
    NGN: "NGN",
    USD: "USD"
};
exports.currency = currency;
const cardType = {
    VIRTUAL: "VIRTUAL",
    PHYSICAL: "PHYSICAL"
};
exports.cardType = cardType;
