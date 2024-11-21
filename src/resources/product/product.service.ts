import { User, ShippingAddress } from "@/resources/user/user.interface";
import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	AddProductDto,
	AddProductReviewDto,
	FetchProductsDto,
	UpdateProductDto,
	WriteReviewDto,
} from "./product.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OtpPurposeOptions,
	StatusMessages,
	YesOrNo,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import productModel from "./product.model";
import categoryModel from "../category/category.model";
import cloudUploader from "@/utils/config/cloudUploader";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import reviewModel from "./review.model";
import mongoose from "mongoose";
import favouriteModel from "./favourite.model";

class ProductService {
	private user = UserModel;
	private product = productModel;
	private category = categoryModel;
	private Review = reviewModel;
	private Favourite = favouriteModel;

	public async addProduct(
		addProductDto: AddProductDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const productExists = await this.product.findOne({
				vendor: user?._id,
				product_name: String(addProductDto.product_name).toLowerCase(),
			});

			if (productExists) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Product With This Name Already Exists",
				};
				return responseData;
			}
			const category = await this.category.findById(addProductDto.category);
			if (!category) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Category Not Found",
				};
				return responseData;
			}
			let image_urls = [];
			if (addProductDto?.images && addProductDto?.images.length > 0) {
				for (const file of addProductDto?.images) {
					const url = await cloudUploader.imageUploader(file);
					image_urls.push(url);
				}
			}
			const newProduct = await this.product.create({
				product_name: String(addProductDto.product_name),
				description: addProductDto?.description,
				category: category?._id,
				vendor: user?._id,
				unit_price: Number(addProductDto?.unit_price),
				product_quantity: Number(addProductDto.product_quantity),
				height: Number(addProductDto.height),
				width: Number(addProductDto.width),
				weight: Number(addProductDto.weight),
				...(addProductDto?.discount_price &&
					addProductDto?.discount_price > 0 && {
						is_discounted: true,
					}),
				...(addProductDto?.discount_price &&
					addProductDto?.discount_price > 0 && {
						discount_price: Number(addProductDto?.discount_price),
					}),
				in_stock: addProductDto.in_stock === YesOrNo.YES ? true : false,
				...(image_urls.length > 0 && {
					images: image_urls,
				}),
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_CREATED,
				message: "Product Added Successfully",
				data: newProduct,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchProducts(
		payload: FetchProductsDto,
		user?: InstanceType<typeof this.user>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(payload?.filter?.product_name && {
					product_name: {
						$regex: payload?.filter?.product_name,
						$options: "i",
					},
				}),
				...(payload?.filter?.category && {
					category: payload?.filter?.category,
				}),
				...(payload?.filter?.price_lower &&
					payload?.filter?.price_upper && {
						unit_price: {
							$gte: payload?.filter?.price_lower,
							$lte: payload?.filter?.price_upper,
						},
					}),
				...(payload?.filter?.rating && {
					rating: {
						$gte: payload?.filter?.rating,
					},
				}),
			};

			const skip = (Number(payload.page) - 1) * Number(payload.limit);
			const pipeline = [
				{
					$match: search,
				},
				{
					$lookup: {
						from: "Favourites",
						localField: "_id",
						foreignField: "product",
						as: "favouritesDetails",
					},
				},
				{
					$addFields: {
						favourite: {
							$cond: {
								if: {
									$gt: [
										{
											$size: {
												$filter: {
													input: "$favouritesDetails",
													cond: { $eq: ["$$this.user", user?._id] },
												},
											},
										},
										0,
									],
								},
								then: true,
								else: false,
							},
						},
					},
				},
				{
					$lookup: {
						from: "Categories",
						localField: "category",
						foreignField: "_id",
						as: "categoryDetails",
					},
				},
				{
					$addFields: {
						category: {
							$arrayElemAt: ["$categoryDetails", 0],
						},
					},
				},
				{
					$project: {
						favouritesDetails: 0,
						categoryDetails: 0,
					},
				},
				{
					$sort: { createdAt: -1 as 1 | -1 },
				},
				{
					$skip: skip,
				},
				{
					$limit: Number(payload.limit),
				},
				{
					$facet: {
						metadata: [{ $count: "total" }],
						products: [{ $skip: skip }, { $limit: Number(payload.limit) }],
					},
				},
			];

			const result = await this.product.aggregate(pipeline);
			const total = result[0]?.metadata[0]?.total || 0;
			const products = result[0]?.products || [];
			const pagination = {
				data: products,
				pagination: {
					pageSize: payload.limit,
					totalCount: total,
					pageCount: Math.ceil(total / payload.limit),
					currentPage: +payload.page,
					hasNext: payload.page * payload.limit < total,
				},
			};

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Products Fetched Successfully",
				data: pagination,
			};

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchVendorProducts(
		payload: FetchProductsDto,
		user: InstanceType<typeof this.user>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(payload?.filter?.product_name && {
					product_name: {
						$regex: payload?.filter?.product_name,
						$options: "i",
					},
				}),
				...(payload?.filter?.category && {
					category: payload?.filter?.category,
				}),
				...(payload?.filter?.price_lower &&
					payload?.filter?.price_upper && {
						unit_price: {
							$gte: payload?.filter?.price_lower,
							$lte: payload?.filter?.price_upper,
						},
					}),
				vendor: user._id,
			};

			var paginatedRecords = await getPaginatedRecords(this.product, {
				limit: payload?.limit,
				page: payload?.page,
				data: search,
				populateObj: {
					path: "category",
					select: "name",
				},
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "My Products Fetched Successfully",
				data: paginatedRecords,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async updateProduct(
		updateProductDto: UpdateProductDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const productExists = await this.product.findOne({
				vendor: user?._id,
				_id: updateProductDto?.product_id,
			});

			if (!productExists) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Product not found",
				};
				return responseData;
			}
			if (updateProductDto?.category) {
				const category = await this.category.findById(
					updateProductDto.category
				);
				if (!category) {
					responseData = {
						status: StatusMessages.error,
						code: HttpCodes.HTTP_BAD_REQUEST,
						message: "Category Not Found",
					};
					return responseData;
				}
			}

			let image_urls = updateProductDto?.existing_images || [];
			console.log("🚀 ~ ProductService ~ image_urls:", image_urls);
			if (updateProductDto?.images && updateProductDto?.images.length > 0) {
				for (const file of updateProductDto.images) {
					const url = await cloudUploader.imageUploader(file);
					if (url) {
						image_urls.push(url);
					}
				}
			}
			const updatedProduct = await this.product.findByIdAndUpdate(
				productExists?._id,
				{
					...(updateProductDto?.product_name && {
						product_name: String(updateProductDto.product_name),
					}),
					...(updateProductDto?.description && {
						description: updateProductDto?.description,
					}),
					...(updateProductDto?.category && {
						category: updateProductDto?.category,
					}),
					...(updateProductDto?.unit_price && {
						unit_price: Number(updateProductDto?.unit_price),
					}),
					...(updateProductDto?.product_quantity && {
						product_quantity: Number(updateProductDto.product_quantity),
					}),
					...(updateProductDto?.discount_price &&
						updateProductDto?.discount_price > 0 && {
							is_discounted: true,
						}),
					...(updateProductDto?.discount_price &&
						updateProductDto?.discount_price > 0 && {
							discount_price: Number(updateProductDto?.discount_price),
						}),
					...(updateProductDto?.in_stock && {
						in_stock: updateProductDto.in_stock === YesOrNo.YES ? true : false,
					}),
					...(updateProductDto?.is_verified && {
						is_verified:
							updateProductDto.is_verified === YesOrNo.YES ? true : false,
					}),
					...(image_urls.length > 0 && {
						images: image_urls,
					}),
				},
				{ new: true }
			);

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Product Updated Successfully",
				data: updatedProduct,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async addProductToWishlist(
		product_id: string,
		user: InstanceType<typeof this.user>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const product = await this.product.findById(product_id);
			if (!product) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Product Not Found",
				};
			}
			const alreadyFavourite = await this.Favourite.findOne({
				product: product_id,
				user: user._id,
			});

			if (alreadyFavourite) {
				await this.Favourite.deleteOne({
					_id: alreadyFavourite?._id,
				});
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product removed from favourites successfully",
					data: null,
				};
				return responseData;
			}

			const favourite = await this.Favourite.create({
				product: product_id,
				user: user._id,
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Product Added To Favourites Successfully",
				data: favourite,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ ProductService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchWishlist(
		payload: FetchProductsDto,
		user: InstanceType<typeof this.user>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			var paginatedRecords = await getPaginatedRecords(this.Favourite, {
				limit: payload?.limit,
				page: payload?.page,
				data: {
					user: user._id,
				},
				populateObj: {
					path: "product",
					populate: {
						path: "category",
						select: "_id name image",
					},
				},
			});

			const paginatedData = paginatedRecords.data.map((mapped) => {
				return {
					...mapped.toObject()?.product,
					wishlist_id: mapped.toObject()._id,
				};
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Wishlist Fetched Successfully",
				// data: paginatedRecords,
				data: {
					data: paginatedData,
					pagination: paginatedRecords.pagination,
				},
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async writeAReview(
		payload: WriteReviewDto,
		user: InstanceType<typeof this.user>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		let review: any;
		try {
			const product = await this.product.findById(payload.product_id);
			if (!product) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Products Not Found",
					data: null,
				};
			}

			const existingReview = await this.Review.findOne({
				user: user?._id,
				product: payload?.product_id,
			});

			if (existingReview) {
				review = await this.Review.findByIdAndUpdate(
					existingReview._id,
					{
						...(payload?.comment && { comment: payload.comment }),
						...(payload?.rating && { rating: payload.rating }),
					},
					{ new: true }
				);
			} else {
				review = await this.Review.create({
					...(payload?.comment && { comment: payload.comment }),
					...(payload?.rating && { rating: payload.rating }),
					product: payload.product_id,
					user: user?._id,
				});
			}
			const avgRating = await this.Review.aggregate([
				{
					$match: {
						product: product._id,
					},
				},
				{
					$group: {
						_id: "$product",
						averageRating: { $avg: "$rating" },
					},
				},
			]);
			if (avgRating.length > 0) {
				product.rating = avgRating[0]?.averageRating;
				await product.save();
			}
			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Products Reviewed Successfully",
				data: review,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ ProductService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async viewAProduct(product_id: string): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const product = await this.product
				.findById(product_id)
				.populate("category");
			if (!product) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Products Not Found",
					data: null,
				};
			}

			const reviews = await this.Review.find({
				product: product_id,
			})
				.populate({
					path: "user",
					select: "FirstName LastName Email ProfileImage",
				})
				.sort({
					createdAt: -1,
					rating: -1,
				});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "Products Retrieved Successfully",
				data: {
					product,
					reviews,
					total_reviews: reviews.length,
				},
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ ProductService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default ProductService;
