// import "dotenv/config";
import dotenv from "dotenv";
import "module-alias/register";
import validateEnv from "@/utils/helpers/validateEnv";
import App from "./app";
import UserController from "@/resources/user/user.controller";
import ProductController from "./resources/product/product.controller";
import BusinessController from "./resources/business/business.controller";
import CategoryService from "./resources/category/category.service";
import CategoryController from "./resources/category/category.controller";
import OrderController from "./resources/order/order.controller";
import MailController from "./resources/mail/mail.controller";
import TransactionController from "./resources/transaction/transaction.controller";
import DeliveryController from "./resources/delivery/delivery.controller";
import AdminOverviewController from "./resources/adminOverview/adminOverview.controller";
import CouponController from "./resources/coupon/coupon.controller";
import AdminPeopleController from "./resources/adminPeople/adminPeople.controller";
import NotificationController from "./resources/notification/notification.controller";
import AdminConfigController from "./resources/adminConfig/adminConfig.controller";
import AdminConfigService from "./resources/adminConfig/adminConfig.service";
import AssignmentController from "./resources/assignment/assignment.controller";

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

const app = new App(
	[
		new AdminConfigController(),
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
		new NotificationController(),
		new AssignmentController(),
	],
	Number(process.env.PORT),
	new CategoryService(),
	new AdminConfigService()
);

app.listen();
