import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import AdminOverviewService from "./adminOverview.service";
import validate from "./adminOverview.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	CreateBusinessDto,
	createCategoryDto,
	CreateCouponDiscountDto,
	CreateCouponDto,
	OverviewDto,
	paginateDto,
	UpdateCouponDto,
	UpdateCustomOrderDto,
	VerificationDto,
} from "./adminOverview.dto";
import upload from "@/utils/config/multer";
import { endOfDay, startOfDay } from "date-fns";
import { backDaterForChart, backTrackToADate } from "@/utils/helpers";
import {
	AccessControlOptions,
	AdminPermissions,
	RequestData,
} from "@/utils/enums/base.enum";
import { AddShippingAddressDto } from "../user/user.dto";
import userModel from "../user/user.model";
import envConfig from "@/utils/config/env.config";
import adminAuthMiddleware from "@/middleware/adminAuth.middleware";
import { AddProductDto, UpdateProductDto } from "../product/product.dto";
import { RequestExt } from "@/utils/interfaces/expRequest.interface";

class AdminOverviewController implements Controller {
	public path = "/admin";
	public router = Router();
	private adminOverviewService = new AdminOverviewService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.get(
			`${this.path}/overview`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.WRITE),
			validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
			this.getOverview
		);

		this.router.get(
			`${this.path}/best-seller`,
			adminAuthMiddleware(AdminPermissions.BUYER, AccessControlOptions.READ),
			validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
			this.getBestSellingProducts
		);

		this.router.get(
			`${this.path}/latest-orders`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
			this.getLatestOrders
		);

		this.router.get(
			`${this.path}/orders`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.getOrdersSchema, RequestData.query),
			this.getOrders
		);

		this.router.get(
			`${this.path}/view-an-order/:id`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.viewAnOrder
		);

		this.router.put(
			`${this.path}/track-an-order/:id`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			validationMiddleware(validate.trackOrderSchema),
			this.trackOrder
		);

		this.router.put(
			`${this.path}/update-custom-order/:id`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.WRITE),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			validationMiddleware(validate.updateCustomOrderSchema),
			this.updateCustomOrder
		);

		this.router.put(
			`${this.path}/cancel-order/:id`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.cancelAnOrder
		);

		this.router.get(
			`${this.path}/products-mgt`,
			adminAuthMiddleware(AdminPermissions.PRODUCT, AccessControlOptions.READ),
			validationMiddleware(validate.getOrdersSchema, RequestData.query),
			this.getProductsMgt
		);

		this.router.post(
			`${this.path}/add-new-product`,
			adminAuthMiddleware(AdminPermissions.PRODUCT, AccessControlOptions.WRITE),
			upload.array("images"),
			validationMiddleware(validate.addProductAdminSchema),
			this.createAProduct
		);

		this.router.put(
			`${this.path}/update-product/:id`,
			adminAuthMiddleware(AdminPermissions.PRODUCT, AccessControlOptions.WRITE),
			upload.array("images"),
			validationMiddleware(validate.updateProductSchema),
			this.updateAProduct
		);

		this.router.get(
			`${this.path}/view-a-product/:id`,
			adminAuthMiddleware(AdminPermissions.PRODUCT, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.viewAProduct
		);

		this.router.post(
			`${this.path}/update-shipping-address`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.addShippingAddressSchema),
			this.adminAddShippingAddress
		);

		this.router.post(
			`${this.path}/create-shipment/:id`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.createShipmentForOrder
		);

		this.router.get(
			`${this.path}/track-shipment/:id`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.trackShipment
		);

		this.router.post(
			`${this.path}/create-coupon`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.WRITE),
			validationMiddleware(validate.createCouponSchema),
			this.createCoupon
		);

		this.router.put(
			`${this.path}/update-coupon/:id`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.WRITE),
			validationMiddleware(validate.updateCouponSchema),
			this.updateCoupon
		);

		this.router.post(
			`${this.path}/create-discount-coupon`,
			adminAuthMiddleware(AdminPermissions.ORDER, AccessControlOptions.WRITE),
			validationMiddleware(validate.createCouponDiscountSchema),
			this.createCouponDiscount
		);

		this.router.get(
			`${this.path}/get-coupons`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.READ),
			validationMiddleware(validate.paginateSchema),
			this.getCoupons
		);

		this.router.get(
			`${this.path}/get-categories`,
			adminAuthMiddleware(AdminPermissions.PRODUCT, AccessControlOptions.READ),
			validationMiddleware(validate.paginateSchema),
			this.getCategories
		);

		this.router.post(
			`${this.path}/add-category`,
			adminAuthMiddleware(AdminPermissions.PRODUCT, AccessControlOptions.WRITE),
			upload.single("image"),
			validationMiddleware(validate.addCategorySchema),
			this.addCategory
		);
	}

	private getOverview = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const backDaterForCurrent = query.timeLine
				? await backDaterForChart({
						input: new Date(),
						format: query.timeLine,
					})
				: undefined;

			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: backDaterForCurrent
					? backDaterForCurrent.array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: backDaterForCurrent
					? backDaterForCurrent.array.slice(-1)[0]?.end
					: undefined;
			const previous_backtrack = backTrackToADate(String(query.timeLine));
			const backDaterForPrevious = previous_backtrack
				? await backDaterForChart({
						input: previous_backtrack,
						format: query.timeLine,
					})
				: undefined;

			const previous_start_date = backDaterForPrevious
				? backDaterForPrevious.array[0]?.start
				: undefined;

			// const previous_end_date = backDaterForPrevious
			// 	? backDaterForPrevious.array.slice(-1)[0]?.end
			// 	: undefined;
			const previous_end_date = backDaterForCurrent
				? backDaterForCurrent.array[0]?.start
				: undefined;

			const advancedReportTimeline = (
				await backDaterForChart({
					input: previous_backtrack,
					format: query.timeLine,
				})
			).array;

			const payload: OverviewDto = {
				start_date,
				end_date,
				previous_start_date,
				previous_end_date,
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminOverviewService.getOverview(
					payload,
					advancedReportTimeline
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getBestSellingProducts = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminOverviewService.getBestSellingProducts(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getLatestOrders = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminOverviewService.getLatestOrders(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getOrders = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(req.query?.status && { status: String(req.query.status) }),
				...(req.query?.tracking_id && {
					tracking_id: String(req.query.tracking_id),
				}),
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminOverviewService.getOrders(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private updateCustomOrder = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: UpdateCustomOrderDto = {
				order_id: String(req.params.id),
				approve_or_decline: req.body.approve_or_decline,
				...(req?.body?.decline_note &&
					req?.body?.decline_note !== "" &&
					req?.body?.decline_note !== null && {
						decline_note: req?.body?.decline_note,
					}),
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminOverviewService.updateCustomOrder(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewAnOrder = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.adminOverviewService.viewAnOrder(String(req.params.id));
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private trackOrder = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const order_id = String(req.params.id);
			const step: number = req.body.step;
			const { status, code, message, data } =
				await this.adminOverviewService.trackOrder(order_id, step);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private cancelAnOrder = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.adminOverviewService.cancelAnOrder(String(req.params.id));
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getProductsMgt = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(req.query?.product_name &&
					req.query?.product_name !== null &&
					req.query?.product_name !== "" && {
						product_name: String(req.query.product_name),
					}),
				...(req.query?.select_type && {
					select_type: String(req.query.select_type),
				}),
				...(req.query?.category && {
					category: String(req.query.category),
				}),
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminOverviewService.getProductMgts(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createAProduct = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: AddProductDto = req.body;
			if (req.files) {
				body.images = req.files as Express.Multer.File[];
			}
			console.log("🚀 ~ ProductController ~ body:", body);

			const { status, code, message, data } =
				await this.adminOverviewService.createProduct(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private updateAProduct = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: UpdateProductDto = {
				product_id: req.params.id,
				...req.body,
			};
			if (req.files) {
				body.images = req.files as Express.Multer.File[];
			}

			const { status, code, message, data } =
				await this.adminOverviewService.updateProduct(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewAProduct = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.adminOverviewService.viewAProduct(String(req.params.id));
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private adminAddShippingAddress = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const address: AddShippingAddressDto = req.body;
			address.is_admin = true;
			const user = req._user || new userModel();
			const sotoUser =
				(await userModel.findOne({
					Email: envConfig.SOTO_EMAIL,
				})) || (await userModel.findOne());
			address.user = sotoUser || user;
			const { status, code, message, data } =
				await this.adminOverviewService.createShippingAddress(address);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createShipmentForOrder = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const sotoUser =
				(await userModel.findOne({
					Email: envConfig.SOTO_EMAIL,
				})) || (await userModel.findOne());
			const payload = {
				soto_user: sotoUser || req._user,
				order_id: String(req.params.id),
			};
			const { status, code, message, data } =
				await this.adminOverviewService.createShipment(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private trackShipment = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.adminOverviewService.trackShipment(String(req.params.id));
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createCoupon = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: CreateCouponDto = req.body;
			const { status, code, message, data } =
				await this.adminOverviewService.createCoupon(
					payload,
					req._user || new userModel()
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private updateCoupon = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: UpdateCouponDto = req.body;
			const coupon_id = String(req.params.id);
			const { status, code, message, data } =
				await this.adminOverviewService.updateCoupon(
					payload,
					coupon_id,
					req._user || new userModel()
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createCouponDiscount = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: CreateCouponDiscountDto = req.body;
			const { status, code, message, data } =
				await this.adminOverviewService.createCouponDiscount(
					payload,
					req._user || new userModel()
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getCoupons = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: paginateDto = {
				limit: req.query?.limit ? Number(req.query.limit) : 10,
				page: req.query?.page ? Number(req.query.page) : 1,
				...(req?.query?.start_date && {
					start_date: new Date(String(req?.query?.start_date)),
				}),
				...(req?.query?.end_date && {
					end_date: new Date(String(req?.query?.end_date)),
				}),
				...(req?.query?.search &&
					req?.query?.search !== null &&
					req?.query?.search !== "" && { search: String(req.query.search) }),
			};
			const { status, code, message, data } =
				await this.adminOverviewService.getCoupons(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getCategories = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: paginateDto = {
				limit: req.query?.limit ? Number(req.query.limit) : 10,
				page: req.query?.page ? Number(req.query.page) : 1,
				...(req?.query?.search &&
					req?.query?.search !== null &&
					req?.query?.search !== "" && { search: String(req.query.search) }),
			};
			const { status, code, message, data } =
				await this.adminOverviewService.getCategories(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private addCategory = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: createCategoryDto = req.body;
			if (req.file) {
				payload.image = req.file as Express.Multer.File;
			}
			const { status, code, message, data } =
				await this.adminOverviewService.addCategory(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default AdminOverviewController;
