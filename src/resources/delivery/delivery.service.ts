import UserModel from "@/resources/user/user.model";
import {
	axiosRequestFunction,
	generateUnusedOrderId,
	getRandomRef,
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
	DeliveryOptionDto,
	GetCitiesDto,
	GetDeliveryRateDto,
	GetPriceViaAgilityDto,
} from "./delivery.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OrderStatus, StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import productModel from "../product/product.model";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import MailService from "../mail/mail.service";
import envConfig from "@/utils/config/env.config";
import orderModel from "../order/order.model";
import { requestProp } from "../mail/mail.interface";
import settingModel from "../adminConfig/setting.model";
import userModel from "@/resources/user/user.model";
import shipmentModel from "./shipment.model";

class DeliveryService {
	private User = userModel;
	private Order = orderModel;
	private Product = productModel;
	private Setting = settingModel;
	private Shipment = shipmentModel;
	public async getRate(payload: GetDeliveryRateDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "deafult error",
		};

		try {
			const order = await this.Order.findById(payload.parcel_id);
			if (!order) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "order not found",
				};
			}
			const packaging = {
				height: 5,
				length: 40,
				name: "Soft Packaging",
				size_unit: "cm",
				type: "soft-packaging",
				weight: 0.01,
				weight_unit: "kg",
				width: 30,
			};
			await axiosRequestFunction({
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/packaging`,
				method: "POST",
				body: packaging,
				headers: {
					Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			})
				.then(async (packageData) => {
					console.log("🚀 PACKAGE CREATION STAGE:", packageData?.data?.message);
					const itemsInOrder = order.items;
					let items = [];
					for (const item of itemsInOrder) {
						items.push({
							description: item.description || "fine item",
							name: item.product_name,
							type: "parcel",
							currency: "NGN",
							value: item.unit_price,
							quantity: item.quantity,
							weight: 0.2,
						});
					}

					const createParcelPayload: any = {
						description: "parcel creation",
						items,
						packaging: packageData.data?.data?.packaging_id,
						weight_unit: packageData.data?.data?.weight_unit,
					};
					await axiosRequestFunction({
						url: envConfig.TERMINAL_AFRICA_BASE_URL + `/parcels`,
						method: "POST",
						body: createParcelPayload,
						headers: {
							Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
						},
					})
						.then(async (parcel: ResponseData) => {
							console.log("🚀 PARCEL CREATION STAGE:", parcel?.data?.message);

							const shipment_address_1 = {
								country: "NG",
								city: "Lagos",
								line1: "6, iyanuwura close shasha egbeda",
								state: "lagos",
							};
							const shipment_address_2 = {
								country: "NG",
								city: "Lagos",
								line1: "26, dr ezekuse close, admiralty road",
								state: "lagos",
							};
							await axiosRequestFunction({
								url: envConfig.TERMINAL_AFRICA_BASE_URL + `/addresses`,
								method: "POST",
								body: shipment_address_2,
								headers: {
									Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
								},
							})
								.then(async (addressData: ResponseData) => {
									console.log(
										"🚀 ADDRESS CREATION STAGE:::",
										addressData?.data?.message
									);

									const shipment_payload = {
										currency: "NGN",
										pickup_address: "AD-7RHWEHMTOW5UMOFM",
										delivery_address: addressData?.data?.data?.address_id,
										//  pickup_address: "AD-7RHWEHMTOW5UMOFM",
										// delivery_address: "AD-PYQP56G6YVEJ3VYR",
										parcel_id: parcel?.data?.data?.parcel_id,
										cash_on_delivery: true,
									};
									await axiosRequestFunction({
										url: envConfig.TERMINAL_AFRICA_BASE_URL + `/rates/shipment`,
										method: "GET",
										params: shipment_payload,
										headers: {
											Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
										},
									})
										.then((res: ResponseData) => {
											console.log(
												"🚀 RATE FETCHING CREATION STAGE:::",
												res?.data?.message
											);
											responseData = {
												status: res.status,
												code: res.code,
												message: res.message,
												data: res?.data?.data,
											};
										})
										.catch((e) => {
											console.log(
												"🚀 ~ RATE FETCHING CREATION STAGE ~ ERROR:",
												e
											);
											responseData.message = e.toString();
											return responseData;
										});
								})
								.catch((e) => {
									console.log("🚀 ~ ADDRESS CREATION STAGE:: ERROR ~ e:", e);
									responseData.message = e.toString();
									return responseData;
								});
						})
						.catch((e) => {
							console.log("🚀 ~ PARCEL CREATION STAGE:: ERROR ~ e:", e);
							responseData.message = e.toString();
							return responseData;
						});
				})
				.catch((e) => {
					console.log("🚀 ~ PACKAGE CREATION STAGE::: ERROR ~ e:", e);
					responseData.message = e.toString();
					return responseData;
				});

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ DeliveryService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getStates(): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "deafult error",
		};

		try {
			await axiosRequestFunction({
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/states`,
				method: "GET",
				params: {
					country_code: "NG",
				},
				headers: {
					Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			})
				.then((res) => {
					responseData = {
						status: res.status,
						code: res.code,
						message: res?.data?.message,
						data: res?.data?.data,
					};
				})
				.catch((e) => {
					console.log("🚀 ~ FETCH STATES ERROR ~ e:", e);
					responseData.message = e.toString();
					return responseData;
				});

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ DeliveryService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getCities(payload: GetCitiesDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "deafult error",
		};

		try {
			await axiosRequestFunction({
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/cities`,
				method: "GET",
				params: {
					country_code: payload.country_code,
					...(payload?.state_code && { state_code: payload?.state_code }),
				},
				headers: {
					Authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			})
				.then((res) => {
					responseData = {
						status: res.status,
						code: res.code,
						message: res?.data?.message,
						data: res?.data?.data,
					};
				})
				.catch((e) => {
					console.log("🚀 ~ FETCH CITIES ERROR ~ e:", e);
					responseData.message = e.toString();
					return responseData;
				});

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ DeliveryService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async selectDeliveryOption(
		payload: DeliveryOptionDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Delivery Vendor Selected Successfully",
		};

		try {
			const { order_id, user, delivery_details } = payload;

			const order = await this.Order.findOne({
				$and: [
					{
						user: user._id,
						_id: order_id,
					},
					{
						status: { $ne: OrderStatus.CANCELLED },
					},
					{
						status: { $ne: OrderStatus.DELIVERED },
					},
				],
			});

			if (!order) {
				responseData.status = StatusMessages.error;
				responseData.code = HttpCodes.HTTP_BAD_REQUEST;
				responseData.message = "Order Not Found";
				return responseData;
			}

			const new_grand_total =
				order.grand_total -
				order.delivery_amount +
				Math.round(delivery_details.amount);
			const updatedOrder = await this.Order.findByIdAndUpdate(
				order_id,
				{
					delivery_amount: delivery_details.amount,
					grand_total: new_grand_total,
					delivery_vendor: delivery_details,
				},
				{ new: true }
			);

			responseData.data = updatedOrder;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ DeliveryService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async loginAgilityLogistics(): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Delivery Vendor Selected Successfully",
		};

		try {
			const agPayload = {
				username: "testaccount@yahoo.com",
				password: "loving",
				sessionObj: "string",
			};
			const axiosConfig: requestProp = {
				url: envConfig.AGILITY_BASE_URL + "/login",
				method: "POST",
				body: agPayload,
			};
			const agilityLogin = await axiosRequestFunction(axiosConfig);
			if (Number(agilityLogin?.code) < 400 && agilityLogin?.data) {
				const config = await this.Setting.findOneAndUpdate(
					{},
					{ agility_token: agilityLogin?.data?.data?.token },
					{ new: true }
				);
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: agilityLogin.message,
					data: {
						agility_data: agilityLogin?.data?.data,
						config,
					},
				};
				return responseData;
			} else {
				return agilityLogin;
			}
		} catch (error: any) {
			console.log("🚀 ~ DeliveryService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getShippingPriceAgility(
		payload?: GetPriceViaAgilityDto,
		user?: InstanceType<typeof this.User>,
		order?: InstanceType<typeof this.Order>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Delivery Vendor Selected Successfully",
		};

		try {
			// const config = await this.Setting.findOne({});
			const loginAg = await this.loginAgilityLogistics();
			if (loginAg.status === StatusMessages.error) {
				return loginAg;
			}
			const config = loginAg.data.config as InstanceType<typeof this.Setting>;

			const agPayload = {
				PreShipmentMobileId: 0,
				SenderName: "TEST ECOMMERCE IT",
				SenderPhoneNumber: "+2347063965528",
				SenderStationId: 1,
				InputtedSenderAddress:
					"21 Emmanuel Olorunfemi St, Ifako Agege, Lagos, Nigeria",
				SenderLocality: "Ifako Ijaye",
				ReceiverStationId: 1,
				SenderAddress: "21 Emmanuel Olorunfemi St, Ifako Agege, Lagos, Nigeria",
				ReceiverName: "Ehinomen",
				ReceiverPhoneNumber: "08039322440",
				ReceiverAddress:
					"Dominos Pizza Gbagada,1A Idowu Olaitan St, Gbagada, Lagos, Nigeria",
				InputtedReceiverAddress:
					"Dominos Pizza Gbagada,1A Idowu Olaitan St, Gbagada, Lagos, Nigeria",
				SenderLocation: {
					Latitude: "6.639438",
					Longitude: "3.330983",
					FormattedAddress: "",
					Name: "",
					LGA: "",
				},
				ReceiverLocation: {
					Latitude: "6.5483775",
					Longitude: "3.3883414",
					FormattedAddress: "",
					Name: "",
					LGA: "",
				},
				PreShipmentItems: [
					{
						PreShipmentItemMobileId: 0,
						Description: "Sample description",
						Weight: 1,
						Weight2: 0,
						ItemType: "Normal",
						ShipmentType: 1,
						ItemName: "Shoe Lace",
						EstimatedPrice: 0,
						Value: "1000",
						ImageUrl: "",
						Quantity: 1,
						SerialNumber: 0,
						IsVolumetric: false,
						Length: null,
						Width: null,
						Height: null,
						PreShipmentMobileId: 0,
						CalculatedPrice: null,
						SpecialPackageId: null,
						IsCancelled: false,
						PictureName: "",
						PictureDate: null,
						WeightRange: "0",
					},
				],
				VehicleType: "BIKE",
				IsBatchPickUp: false,
				WaybillImage: "",
				WaybillImageFormat: "",
				DestinationServiceCenterId: 0,
				DestinationServiceCentreId: 0,
				IsCashOnDelivery: false,
				CashOnDeliveryAmount: 0.0,
			};

			const axiosConfig: requestProp = {
				url: envConfig.AGILITY_BASE_URL + "/price",
				method: "POST",
				body: agPayload,
				headers: {
					Authorization: `Bearer ${config?.agility_token}`,
				},
			};
			const agilityLogin = await axiosRequestFunction(axiosConfig);
			if (Number(agilityLogin?.code) < 400 && agilityLogin?.data) {
				const shipping_cost = nearest(
					Number(agilityLogin?.data?.object?.grandTotal),
					50
				);
				const shipping_items =
					agilityLogin?.data?.object?.preshipmentMobile?.preShipmentItems;
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: agilityLogin.message,
					data: {
						shipping_cost,
						shipping_items,
						agility_payload: agPayload,
					},
				};
				if (user && order) {
					order.delivery_amount = shipping_cost;
					order.agility_price_payload = agPayload;
					await order.save();
				}
				return responseData;
			} else {
				return agilityLogin;
			}
		} catch (error: any) {
			console.log(
				"🚀 ~ DeliveryService ~ getShippingPriceAgility ~ error:",
				error
			);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async getShippingPriceAgility1(
		payload: GetPriceViaAgilityDto,
		user: InstanceType<typeof this.User>,
		order?: InstanceType<typeof this.Order>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Delivery Vendor Selected Successfully",
		};

		try {
			const loginAg = await this.loginAgilityLogistics();
			if (loginAg.status === StatusMessages.error) {
				return loginAg;
			}
			const config = loginAg.data.config as InstanceType<typeof this.Setting>;
			const preshipmentItems: any[] = [];

			for (const item of payload.items) {
				const product = await this.Product.findById(item.product_id);
				preshipmentItems.push({
					PreShipmentItemMobileId: 0,
					Description: product?.description,
					Weight: product?.weight || 1,
					Weight2: 0,
					ItemType: "Normal",
					ShipmentType: 1,
					ItemName: product?.product_name,
					EstimatedPrice: product?.unit_price,
					Value: "1000",
					ImageUrl: "",
					Quantity: item?.quantity,
					SerialNumber: 0,
					IsVolumetric: false,
					Length: null,
					Width: null,
					Height: null,
					PreShipmentMobileId: 0,
					CalculatedPrice: null,
					SpecialPackageId: null,
					IsCancelled: false,
					PictureName: "",
					PictureDate: null,
					WeightRange: "0",
				});
			}

			const agPayload = {
				PreShipmentMobileId: 0,
				SenderName: "SOTO e commerce",
				SenderPhoneNumber: "+2347063965528",
				SenderStationId: 1,
				InputtedSenderAddress: config.ShippingAddress?.full_address,
				SenderLocality: config.ShippingAddress?.city,
				ReceiverStationId: 1,
				SenderAddress: config.ShippingAddress?.full_address,
				ReceiverName: user.FirstName + " " + user.LastName,
				ReceiverPhoneNumber: user.PhoneNumber,
				ReceiverAddress: user.ShippingAddress?.full_address,
				InputtedReceiverAddress: user.ShippingAddress?.full_address,
				SenderLocation: {
					Latitude: String(config.ShippingAddress?.coordinates?.lat),
					Longitude: String(config.ShippingAddress?.coordinates?.lng),
					FormattedAddress: "",
					Name: "",
					LGA: "",
				},
				ReceiverLocation: {
					Latitude: String(user.ShippingAddress?.coordinates?.lat),
					Longitude: String(user.ShippingAddress?.coordinates?.lng),
					FormattedAddress: "",
					Name: "",
					LGA: "",
				},
				PreShipmentItems: preshipmentItems,
				VehicleType: "BIKE",
				IsBatchPickUp: false,
				WaybillImage: "",
				WaybillImageFormat: "",
				DestinationServiceCenterId: 0,
				DestinationServiceCentreId: 0,
				IsCashOnDelivery: false,
				CashOnDeliveryAmount: 0.0,
			};

			const axiosConfig: requestProp = {
				url: envConfig.AGILITY_BASE_URL + "/price",
				method: "POST",
				body: agPayload,
				headers: {
					Authorization: `Bearer ${config?.agility_token}`,
				},
			};
			const agilityLogin = await axiosRequestFunction(axiosConfig);
			if (Number(agilityLogin?.code) < 400 && agilityLogin?.data) {
				const shipping_cost = nearest(
					Number(agilityLogin?.data?.object?.grandTotal),
					50
				);
				const shipping_items =
					agilityLogin?.data?.object?.preshipmentMobile?.preShipmentItems;
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: agilityLogin.message,
					data: {
						shipping_cost,
						shipping_items,
					},
				};
				if (user && order) {
					order.delivery_amount = shipping_cost;
					order.agility_price_payload = agPayload;
					await order.save();
				}
				return responseData;
			} else {
				return agilityLogin;
			}
		} catch (error: any) {
			console.log(
				"🚀 ~ DeliveryService ~ getShippingPriceAgility ~ error:",
				error
			);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async captureShipmentByAgility(
		order: InstanceType<typeof this.Order>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Shipment Captured Successfully",
		};
		if (order.shipment) {
			responseData.data = order;
			return responseData;
		}
		try {
			const loginAg = await this.loginAgilityLogistics();
			if (loginAg.status === StatusMessages.error) {
				return loginAg;
			}
			const config = loginAg.data.config as InstanceType<typeof this.Setting>;
			const agPayload = order.agility_price_payload;
			const axiosConfig: requestProp = {
				url: envConfig.AGILITY_BASE_URL + "/captureshipment",
				method: "POST",
				body: agPayload,
				headers: {
					Authorization: `Bearer ${config?.agility_token}`,
				},
			};
			const agilityCaptureShipment = await axiosRequestFunction(axiosConfig);
			if (
				Number(agilityCaptureShipment?.code) < 400 &&
				agilityCaptureShipment?.data
			) {
				const shipment = await this.Shipment.create({
					order: order._id,
					capturedShipMent: agilityCaptureShipment.data?.object,
				});
				const shippedOrder = await this.Order.findByIdAndUpdate(
					order._id,
					{
						shipment: shipment._id,
						agility_captured_shipment: agilityCaptureShipment.data?.object,
					},
					{ new: true }
				);

				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: agilityCaptureShipment.message,
					data: shippedOrder,
				};
				return responseData;
			} else {
				return agilityCaptureShipment;
			}
		} catch (error: any) {
			console.log(
				"🚀 ~ DeliveryService ~ captureShipmentByAgility ~ error:",
				error
			);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default DeliveryService;
