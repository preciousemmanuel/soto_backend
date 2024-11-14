// import "dotenv/config";
import dotenv from 'dotenv';
import "module-alias/register";
import validateEnv from '@/utils/helpers/validateEnv';
import App from "./app";
import UserController from "@/resources/user/user.controller";
import ProductController from './resources/product/product.controller';
import BusinessController from './resources/business/business.controller';
import CategoryService from './resources/category/category.service';
import CategoryController from './resources/category/category.controller';
import OrderController from './resources/order/order.controller';
import MailController from './resources/mail/mail.controller';
import TransactionController from './resources/transaction/transaction.controller';
import DeliveryController from './resources/delivery/delivery.controller';
import AdminOverviewController from './resources/adminOverview/adminOverview.controller';
import CouponController from './resources/coupon/coupon.controller';
import AdminOverviewService from './resources/adminOverview/adminOverview.service';
import AdminPeopleController from './resources/adminPeople/adminPeople.controller';

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

const app = new App([
    new AdminOverviewController(),
    new AdminPeopleController(),
    new BusinessController(),
    new CategoryController(),
    new DeliveryController(),
    new MailController(),
    new OrderController(),
    new ProductController(),
    new TransactionController(),
    new UserController(),
    new CouponController(),

],
    Number(process.env.PORT),
    new CategoryService(),
    new AdminOverviewService(),
);

app.listen();