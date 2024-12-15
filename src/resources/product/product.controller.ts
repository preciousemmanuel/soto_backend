import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./product.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	AddProductDto,
	FetchProductsDto,
	UpdateProductDto,
	WriteReviewDto,
} from "./product.dto";
import ProductService from "./product.service";
import upload from "@/utils/config/multer";

class ProductController implements Controller {
	public path = "/product";
	public router = Router();
	private productService = new ProductService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/add-new`,
			authenticatedMiddleware,
			upload.array("images"),
			validationMiddleware(validate.addProductSchema),
			this.addProduct
		);

		this.router.get(
			`${this.path}/fetch`,
			authenticatedMiddleware,
			validationMiddleware(validate.fetchProductSchema),
			this.fetchProducts
		);

		this.router.get(
			`${this.path}/vendor-fetch`,
			authenticatedMiddleware,
			validationMiddleware(validate.fetchProductSchema),
			this.fetchVendorProducts
		);

		this.router.put(
			`${this.path}/update/:id`,
			authenticatedMiddleware,
			upload.array("images"),
			validationMiddleware(validate.updateProductSchema),
			this.updateProduct
		);

		this.router.post(
			`${this.path}/add-to-wishlist/:id`,
			authenticatedMiddleware,
			this.addProductToWihlist
		);

		this.router.get(
			`${this.path}/fetch-wishlist`,
			authenticatedMiddleware,
			validationMiddleware(validate.fetchProductSchema),
			this.fetchProductWishlist
		);

		this.router.get(`${this.path}/view-one/:id`, this.viewAProduct);

		this.router.post(
			`${this.path}/write-a-review/:id`,
			authenticatedMiddleware,
			validationMiddleware(validate.writeAReviewSchema),
			this.writeAReview
		);
	}

	private addProduct = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: AddProductDto = req.body;
			const user = req.user;
			if (req.files) {
				body.images = req.files as Express.Multer.File[];
			}
			console.log("🚀 ~ ProductController ~ body:", body);

			const { status, code, message, data } =
				await this.productService.addProduct(body, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchProducts = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: FetchProductsDto = {
				limit: Number(req?.query?.limit),
				page: Number(req?.query?.page),
				filter: {
					...(req?.query?.product_name && {
						product_name: String(req?.query?.product_name),
					}),
					...(req?.query?.category && {
						category: String(req?.query?.category),
					}),
					...(req?.query?.price_upper && {
						price_upper: Number(req?.query?.price_upper),
					}),
					...(req?.query?.price_lower && {
						price_lower: Number(req?.query?.price_lower),
					}),
					...(req?.query?.rating && { rating: Number(req?.query?.rating) }),
				},
				...(req?.query?.fetch_type &&
					req?.query?.fetch_type !== null &&
					req?.query?.fetch_type !== "" && {
						fetch_type: String(req?.query?.fetch_type),
					}),
			};

			const { status, code, message, data } =
				await this.productService.fetchProducts(payload, req?.user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchVendorProducts = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: FetchProductsDto = {
				limit: Number(req?.query?.limit),
				page: Number(req?.query?.page),
				filter: {
					...(req?.query?.product_name && {
						product_name: String(req?.query?.product_name),
					}),
					...(req?.query?.category && {
						category: String(req?.query?.category),
					}),
					...(req?.query?.price_upper && {
						price_upper: Number(req?.query?.price_upper),
					}),
					...(req?.query?.price_lower && {
						price_lower: Number(req?.query?.price_lower),
					}),

					...(req?.query?.product_status && {
						status: String(req?.query?.product_status),
					}),
				},
			};
			const user = req.user;
			const { status, code, message, data } =
				await this.productService.fetchVendorProducts(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private updateProduct = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: UpdateProductDto = {
				product_id: req.params.id,
				...req.body,
			};
			const user = req.user;
			if (req.files) {
				payload.images = req.files as Express.Multer.File[];
			}
			console.log("🚀 ~ ProductController ~ payload:", payload);

			const { status, code, message, data } =
				await this.productService.updateProduct(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewAProduct = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: string = req.params.id;
			const { status, code, message, data } =
				await this.productService.viewAProduct(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private addProductToWihlist = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: string = req.params.id;
			const user = req.user;
			const { status, code, message, data } =
				await this.productService.addProductToWishlist(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchProductWishlist = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: FetchProductsDto = {
				limit: Number(req?.query?.limit),
				page: Number(req?.query?.page),
			};
			const user = req.user;
			const { status, code, message, data } =
				await this.productService.fetchWishlist(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private writeAReview = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: WriteReviewDto = {
				product_id: req?.params.id,
				comment: req?.body?.comment,
				rating: req?.body?.rating,
			};
			const user = req.user;
			const { status, code, message, data } =
				await this.productService.writeAReview(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default ProductController;
