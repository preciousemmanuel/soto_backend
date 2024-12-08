import { User, ShippingAddress } from "@/resources/user/user.interface";
import UserModel from "@/resources/user/user.model";
import {
	generateUnusedProductCode,
	nearest,
	uniqueCode,
} from "@/utils/helpers";
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
	MultipleOptionsAndDto,
	MultipleOptionsDto,
	UpdateProductDto,
	WriteReviewDto,
} from "./product.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OtpPurposeOptions,
	ProductFetchTypes,
	ProductStatus,
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
import mongoose, { PipelineStage } from "mongoose";
import favouriteModel from "./favourite.model";
import settingModel from "../adminConfig/setting.model";

class ProductService {
	private user = UserModel;
	private product = productModel;
	private category = categoryModel;
	private Review = reviewModel;
	private Favourite = favouriteModel;
	private Settings = settingModel;

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
			const managed_unit_price = await this.manageInterestOnProduct(
				Number(addProductDto?.unit_price)
			);
			const product_code = await generateUnusedProductCode();
			const newProduct = await this.product.create({
				product_name: String(addProductDto.product_name),
				description: addProductDto?.description,
				product_code,
				category: category?._id,
				vendor: user?._id,
				unit_price: managed_unit_price,
				raw_price: Number(addProductDto?.unit_price),
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
		let message: string;
		try {
			const fetch_type = payload?.fetch_type;
			const multipleOptions =
				payload?.filter?.product_name &&
				payload?.filter?.product_name.includes(",")
					? payload.filter?.product_name.split(",")
					: [];

			let searchOptions: MultipleOptionsDto = {
				$or: [],
			};
			if (multipleOptions.length > 0) {
				for (let i = 0; i < multipleOptions.length; i++) {
					const element = multipleOptions[i].trim();
					searchOptions.$or.push({
						product_name: {
							$regex: element,
							$options: "i",
						},
					});
				}
			}
			let nameSearch =
				multipleOptions.length > 0
					? searchOptions
					: payload?.filter?.product_name
						? {
								product_name: {
									$regex: payload?.filter?.product_name.trim(),
									$options: "i",
								},
							}
						: undefined;
			const search = {
				// ...(payload?.filter?.product_name && {
				// 	product_name: {
				// 		$regex: payload?.filter?.product_name,
				// 		$options: "i",
				// 	},
				// }),
				...(payload?.filter?.category && {
					category: new mongoose.Types.ObjectId(payload?.filter?.category),
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
			const matchAndStage: MultipleOptionsAndDto = {
				$and: [search],
			};
			if (nameSearch) {
				matchAndStage.$and.push(nameSearch);
			}
			console.log("🚀 ~ ProductService ~ matchAndStage:", matchAndStage);

			const skip = (Number(payload.page) - 1) * Number(payload.limit);
			let pipeline = [];
			if (fetch_type && fetch_type === ProductFetchTypes.POPULAR) {
				pipeline = [
					{
						$match: matchAndStage,
						// $match: search,
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
						$lookup: {
							from: "OrderDetails",
							localField: "_id",
							foreignField: "product_id",
							as: "orderDetails",
						},
					},
					{
						$addFields: {
							total_items_ordered: {
								$ifNull: [
									{
										$sum: {
											$map: {
												input: {
													$filter: {
														input: "$orderDetails",
														as: "order",
														cond: {
															$and: [
																{
																	$eq: [
																		{ $month: "$$order.createdAt" },
																		{ $month: new Date() },
																	],
																},
																{
																	$eq: [
																		{ $year: "$$order.createdAt" },
																		{ $year: new Date() },
																	],
																},
															],
														},
													},
												},
												as: "filteredOrder",
												in: "$$filteredOrder.quantity",
											},
										},
									},
									0,
								],
							},
						},
					},
					{
						$project: {
							favouritesDetails: 0,
							categoryDetails: 0,
							orderDetails: 0,
						},
					},
					{
						$sort: { total_items_ordered: -1 as 1 | -1 },
					},
					{
						$facet: {
							metadata: [{ $count: "total" }],
							products: [{ $skip: skip }, { $limit: Number(payload.limit) }],
						},
					},
				];
				message = "Popular Products Fetched Successfully";
			} else {
				pipeline = [
					{
						// $match: search,
						$match: matchAndStage,
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
						$lookup: {
							from: "OrderDetails",
							localField: "_id",
							foreignField: "product_id",
							as: "orderDetails",
						},
					},
					{
						$project: {
							favouritesDetails: 0,
							categoryDetails: 0,
							orderDetails: 0,
						},
					},
					{
						$sort: { total_items_ordered: -1 as 1 | -1 },
					},
					{
						$facet: {
							metadata: [{ $count: "total" }],
							products: [{ $skip: skip }, { $limit: Number(payload.limit) }],
						},
					},
				];
				message = "Products Fetched Successfully";
			}

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
				message,
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
				// vendor: user?._id,
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
						unit_price: await this.manageInterestOnProduct(
							Number(updateProductDto?.unit_price)
						),
					}),
					...(updateProductDto?.unit_price && {
						raw_price: Number(updateProductDto?.unit_price),
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
					...(updateProductDto?.is_verified && {
						status:
							updateProductDto.is_verified === YesOrNo.YES
								? ProductStatus.APPROVED
								: updateProductDto.is_verified === YesOrNo.NO
									? ProductStatus.DECLINED
									: ProductStatus.PENDING,
					}),
					...(updateProductDto?.decline_product_note && {
						decline_product_note: updateProductDto?.decline_product_note,
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

	public async manageInterestOnProduct(unit_price: number): Promise<number> {
		try {
			let managed_price = unit_price;
			const configSetting = await this.Settings.findOne({});
			const flat = configSetting?.interest_rates?.flat || 0;
			const special = configSetting?.interest_rates?.special || 0;
			switch (unit_price < 1000000) {
				case true:
					managed_price = nearest(
						unit_price + Math.round(unit_price * (flat / 100)),
						50
					);
					break;

				default:
					managed_price = nearest(
						unit_price + Math.round(unit_price * (special / 100)),
						50
					);
					break;
			}

			return managed_price;
		} catch (error) {
			return unit_price;
		}
	}
}

export default ProductService;
