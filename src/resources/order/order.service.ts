import UserModel from "@/resources/user/user.model";
import { generateUnusedOrderId, uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	AddToCartDto,
	CreateOrderDto,
	FetchMyOrdersDto,
	RemoveFromCartDto,
} from "./order.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	UserTypes,
	YesOrNo,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import orderModel from "./order.model";
import productModel from "../product/product.model";
import { ItemInCart, itemsToBeOrdered, orderItems } from "./order.interface";
import orderDetailsModel from "./orderDetails.model";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import cartModel from "./cart.model";
import MailService from "../mail/mail.service";
import NotificationService from "../notification/notification.service";
import AssignmentService from "../assignment/assignment.service";

class OrderService {
	private Order = orderModel;
	private Cart = cartModel;
	private OrderDetail = orderDetailsModel;
	private User = UserModel;
	private Product = productModel;
	private mailService = new MailService();
	private notificationService = new NotificationService();
	private assignmentService = new AssignmentService();

	public async addToCart(
		payload: AddToCartDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		let product_ids: string[] = [];
		try {
			const openCart = await this.Cart.findOne({
				user: user?._id,
			});
			const currentItemsInCart: any[] = openCart
				? [...openCart.toObject().items]
				: [];
			const itemsToEnterCart = payload.items;
			// currentItemsInCart.push(...payload.items)
			for (const item of itemsToEnterCart) {
				product_ids.push(item.product_id);
			}
			const products = await this.Product.find({
				_id: { $in: product_ids },
				// is_verified: true
			});

			const purpose = "cart";
			const processedItems = await this.processMathcingItems(
				itemsToEnterCart,
				currentItemsInCart,
				products,
				user,
				purpose
			);
			if (processedItems.status === StatusMessages.error) {
				return processedItems;
			}

			if (openCart) {
				const current_items_in_cart = openCart.items;
				current_items_in_cart.push(...processedItems?.data?.itemsInOrder);
				openCart.items = processedItems?.data?.itemsInOrder;
				openCart.total_amount = processedItems?.data?.total_amount;
				openCart.grand_total = processedItems?.data?.total_amount;
				openCart.save();
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Added To Cart Successfully",
					data: openCart,
				};
			} else {
				const newCart = await this.Cart.create({
					items: processedItems?.data?.itemsInOrder,
					total_amount: processedItems?.data?.total_amount,
					user: user._id,
					status: OrderStatus.PENDING,
					grand_total: processedItems?.data?.total_amount,
				});

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Added To Cart Successfully",
					data: newCart,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async removeFromCart(
		payload: RemoveFromCartDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const openCart = await this.Cart.findOne({
				user: user?._id,
			});
			if (openCart) {
				const current_items_in_cart = openCart.items;
				const current_total = openCart.total_amount;
				const product = current_items_in_cart.find(
					(item) => String(item.product_id) === String(payload.product_id)
				);
				const newItemsCart = current_items_in_cart.filter(
					(item) => String(item.product_id) !== String(payload.product_id)
				);
				const product_quantity = product?.quantity || 0;
				const product_unit_price = product?.unit_price || 0;
				const new_total = current_total - product_quantity * product_unit_price;
				const updatedCart = await this.Cart.findByIdAndUpdate(
					openCart._id,
					{
						items: newItemsCart,
						total_amount: new_total,
						grand_total: new_total,
					},
					{ new: true }
				);

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Removed To Cart Successfully",
					data: updatedCart,
				};
			} else {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Product Removed To Cart Successfully",
					data: null,
				};
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async createOrder(
		payload: CreateOrderDto,
		user: InstanceType<typeof UserModel>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		let product_ids: string[] = [];
		try {
			for (const item of payload.items) {
				product_ids.push(item.product_id);
			}
			const products = await this.Product.find({
				_id: { $in: product_ids },
				// is_verified: true
			});
			const cartItems =
				payload.checkout_with_cart === YesOrNo.YES
					? (await this.Cart.findOne({ user: user._id }))?.items || []
					: [];
			const purpose = "cart";
			const processedItems = await this.processMathcingItems(
				payload.items,
				cartItems,
				products,
				user,
				purpose
			);
			if (processedItems.status === StatusMessages.error) {
				return processedItems;
			}
			const openCart = await this.Order.findOne({
				user: user._id,
				status: OrderStatus.PENDING,
			});
			if (payload.checkout_with_cart === YesOrNo.YES) {
				await this.Cart.findOneAndUpdate(
					{ user: user._id },
					{
						items: null,
						total_amount: 0,
						grand_total: 0,
					},
					{ new: true }
				);
			}
			if (openCart) {
				console.log("🚀 ~ OrderService ~ openCart:", openCart);
				openCart.items = processedItems?.data?.itemsInOrder;
				openCart.total_amount = processedItems?.data?.total_amount;
				openCart.shipping_address =
					payload.shipping_address || user.ShippingAddress?.full_address || "";
				openCart.grand_total = processedItems?.data?.total_amount;
				openCart.payment_type = payload?.payment_type || openCart?.payment_type;
				openCart.save();
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "Order Created Successfully",
					data: openCart,
				};
			} else {
				const tracking_id = await generateUnusedOrderId();
				const newOrder = await this.Order.create({
					items: processedItems?.data?.itemsInOrder,
					total_amount: processedItems?.data?.total_amount,
					user: user._id,
					status: OrderStatus.PENDING,
					shipping_address:
						payload.shipping_address ||
						user.ShippingAddress?.full_address ||
						"",
					grand_total: processedItems?.data?.total_amount,
					tracking_id,
					...(payload?.payment_type && { payment_type: payload?.payment_type }),
				});

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_CREATED,
					message: "Order Created Successfully",
					data: newOrder,
				};
				this.notificationService.createNotification({
					receiver: String(newOrder.user),
					title: "Create Order",
					content: `You just created an order with tracking id : ${newOrder.tracking_id}`,
				});
			}

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async processMathcingItems(
		items: orderItems[],
		currentCartItems: any[],
		products: InstanceType<typeof this.Product>[],
		user: InstanceType<typeof this.User>,
		purpose: string
	): Promise<ResponseData> {
		let total_amount = 0;
		let responseData: ResponseData;
		const messages: string[] = [];
		let itemsInOrder: itemsToBeOrdered[] = [];
		try {
			const productMap: Map<
				string,
				{
					_id: string;
					product_name: string;
					product_quantity: number;
					description: string;
					vendor?: string;
					images: string[];
					height: number;
					width: number;
					weight: number;
					unit_price: number;
					is_discounted: boolean;
				}
			> = new Map();

			products.forEach((product) => {
				productMap.set(product._id.toString(), {
					_id: String(product._id),
					product_quantity: product.product_quantity,
					unit_price: product.unit_price,
					product_name: product.product_name,
					description: product.description,
					vendor: String(product.vendor),
					images: product.images,
					height: product.height,
					width: product.width,
					weight: product.weight,
					is_discounted: product.is_discounted,
				});
			});

			items.forEach((item) => {
				const product = productMap.get(item.product_id.toString());
				if (!product) {
					console.warn(`Product with ID ${item.product_id} not found.`);
					return;
				}
				if (item.quantity > product.product_quantity) {
					console.warn(
						`Quantity of product ${item.product_id} exceeds available stock.`
					);
					messages.push(
						`Available Quantities For ${product.product_name} is ${product.product_quantity}`
					);
					return;
				}
				const cartItem = currentCartItems.find(
					(cartItem) => cartItem.product_id.toString() === item.product_id
				);
				if (cartItem) {
					console.log("🚀 ~ OrderService ~ cartItem:", cartItem);
					cartItem.quantity += item.quantity;
				} else {
					const newItemToCart = {
						product_id: String(item.product_id),
						quantity: item.quantity,
						unit_price: product.unit_price,
						product_name: product.product_name,
						description: product.description,
						vendor: product.vendor,
						images: product.images,
						height: product.height,
						width: product.width,
						weight: product.weight,
						is_discounted: product.is_discounted,
					};
					currentCartItems.push(newItemToCart);
				}
			});
			total_amount = currentCartItems.reduce((total, cartItem) => {
				return total + cartItem.quantity * cartItem.unit_price;
			}, 0);
			const response = {
				itemsInOrder: currentCartItems,
				total_amount: total_amount,
			};
			if (messages.length > 0) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: messages.toString(),
				};
			} else {
				switch (purpose) {
					case "order":
						// this.createOrderDetails(itemsInOrder, user)
						break;
					default:
						break;
				}
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: "",
					data: response,
				};
			}
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ processMathcingItems ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getMyOrders(
		myOrdersDto: FetchMyOrdersDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(myOrdersDto?.filter?.start_date &&
					myOrdersDto?.filter?.end_date && {
						createdAt: {
							$gte: new Date(myOrdersDto?.filter?.start_date),
							$lte: new Date(myOrdersDto?.filter?.end_date),
						},
					}),
				...(myOrdersDto?.filter?.status && {
					status: myOrdersDto?.filter?.status,
				}),
				vendor: user?._id,
			};

			var paginatedRecords = await getPaginatedRecords(this.OrderDetail, {
				limit: myOrdersDto?.limit,
				page: myOrdersDto?.page,
				data: search,
				populateObj: {
					path: "buyer",
					select: "FirstName LastName",
				},
				populateObj1: {
					path: "product_id",
					select: "product_name images product_quantity",
				},
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: paginatedRecords,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getMyOrdersBuyer(
		myOrdersDto: FetchMyOrdersDto,
		user: InstanceType<typeof this.User>
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const search = {
				...(myOrdersDto?.filter?.start_date &&
					myOrdersDto?.filter?.end_date && {
						createdAt: {
							$gte: new Date(myOrdersDto?.filter?.start_date),
							$lte: new Date(myOrdersDto?.filter?.end_date),
						},
					}),
				...(myOrdersDto?.filter?.status && {
					status: myOrdersDto?.filter?.status,
				}),
				user: user?._id,
			};

			var paginatedRecords = await getPaginatedRecords(this.Order, {
				limit: myOrdersDto?.limit,
				page: myOrdersDto?.page,
				data: search,
			});

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: paginatedRecords,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async createOrderDetails(
		itemsInOrder: itemsToBeOrdered[] | ItemInCart[],
		user: any,
		Order: any
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			console.log("TIME TO CREATE ORDER DETAILS>>>>>>");

			const order_details: any[] = [];
			for (const item of itemsInOrder) {
				order_details.push({
					...item,
					buyer: user?._id,
					order: Order?._id,
				});
			}
			const inserted = await this.OrderDetail.insertMany(order_details);

			const details_ids = [];
			for (const item of inserted) {
				details_ids.push(item?._id);
			}
			if (details_ids.length > 0) {
				const details_to_vendors = await this.OrderDetail.find({
					_id: { $in: details_ids },
				});
				this.sendOrderToVendors(details_to_vendors);
				this.assignmentService.createAssignments({
					buyer: user,
					order_details: inserted as InstanceType<typeof this.OrderDetail>[],
				});
			}

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: inserted,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async confirmOrderPayment(
		narration_id: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const order = await this.Order.findById(narration_id);

			if (!order) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
				return responseData;
			}
			const user = await this.User.findById(order.user);

			const completedOrder = await this.Order.findByIdAndUpdate(
				order._id,
				{
					status: OrderStatus.BOOKED,
				},
				{ new: true }
			);

			const updateData = order.toObject().items.map((item) => {
				return {
					updateOne: {
						filter: { _id: item.product_id },
						update: {
							$inc: {
								product_quantity: -item.quantity,
								total_quantity_sold: item.quantity,
							},
						},
					},
				};
			});
			const updateProduct = await this.Product.bulkWrite(updateData);
			const fineTuneItems = order.toObject().items.map((item) => {
				return {
					product_id: String(item.product_id),
					product_name: item.product_name,
					description: item.description,
					vendor: String(item.vendor),
					images: item.images,
					quantity: item.quantity,
					unit_price: item.unit_price,
					height: item.height,
					width: item.width,
					weight: item.weight,
					is_discounted: item.is_discounted,
					status: OrderStatus.BOOKED,
				};
			});
			this.createOrderDetails(fineTuneItems, user, order);

			responseData = {
				status: StatusMessages.success,
				code: HttpCodes.HTTP_OK,
				message: "success",
				data: {
					completedOrder,
					updateProduct,
				},
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async sendOrderToVendors(order_details: any[]): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "success",
			data: null,
		};
		try {
			console.log("TIME TO SEND EMAILS OF ORDERS TO VENDORS");
			console.log(
				"🚀 ~ OrderService ~ sendOrderToVendors ~ order_details:",
				order_details.length
			);

			const groupedItems = order_details.reduce(
				(acc, item) => {
					const vendorId = String(item?.vendor);
					if (vendorId) {
						if (!acc[vendorId]) {
							acc[vendorId] = [];
						}
						acc[vendorId].push(item);
					}
					return acc;
				},
				{} as { [vendor: string]: any[] }
			);

			Object.keys(groupedItems).forEach(async (vendor) => {
				const vendorItems = groupedItems[vendor];
				if (vendorItems.length > 0) {
					const user = await this.User.findById(vendor);
					const emailPayload = {
						business_name: user?.FirstName,
						email: user?.Email,
						items: vendorItems,
					};
					this.mailService.sendOrdersToVendor(emailPayload);
				}
			});
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ OrderService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async viewAnOrder(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Order Retrieved Successfully",
		};
		try {
			const { order_id, user } = payload;
			const order = await this.Order.findOne({ _id: order_id, user: user._id })
				.populate({
					path: "items.vendor",
					select: "firstName lastName Email ProfileImage PhoneNumber",
				})
				.populate({
					path: "user",
					select: "FirstName LastName ProfileImage Email PhoneNumber",
				})
				.populate("shipment");

			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Order Not Found",
				};
			}

			responseData.data = order;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ viewAnOrder ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default OrderService;
