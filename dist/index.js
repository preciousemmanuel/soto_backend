"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import "dotenv/config";
const dotenv_1 = __importDefault(require("dotenv"));
require("module-alias/register");
const validateEnv_1 = __importDefault(require("@/utils/helpers/validateEnv"));
const app_1 = __importDefault(require("./app"));
const user_controller_1 = __importDefault(require("@/resources/user/user.controller"));
const product_controller_1 = __importDefault(require("./resources/product/product.controller"));
const business_controller_1 = __importDefault(require("./resources/business/business.controller"));
const category_service_1 = __importDefault(require("./resources/category/category.service"));
const category_controller_1 = __importDefault(require("./resources/category/category.controller"));
const order_controller_1 = __importDefault(require("./resources/order/order.controller"));
const mail_controller_1 = __importDefault(require("./resources/mail/mail.controller"));
const transaction_controller_1 = __importDefault(require("./resources/transaction/transaction.controller"));
dotenv_1.default.config({ path: `${process.env.NODE_ENV}.env` });
(0, validateEnv_1.default)();
const app = new app_1.default([
    new user_controller_1.default(),
    new product_controller_1.default(),
    new business_controller_1.default(),
    new category_controller_1.default(),
    new order_controller_1.default(),
    new mail_controller_1.default(),
    new transaction_controller_1.default()
    // new TransactionController(),
], Number(process.env.PORT), new category_service_1.default());
app.listen();
