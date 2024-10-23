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

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

const app = new App([
    new UserController(),
    new ProductController(),
    new BusinessController(),
    new CategoryController(),
    new OrderController(),
    new MailController(),
    new TransactionController()


    // new TransactionController(),
],
    Number(process.env.PORT),
    new CategoryService()
);

app.listen();