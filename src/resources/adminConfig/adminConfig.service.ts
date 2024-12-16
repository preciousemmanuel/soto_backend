import UserModel from "@/resources/user/user.model";
import {
	axiosRequestFunction,
	formatPhoneNumber,
	genAphaNumericCode,
	generateUnusedAdminId,
	getFirstSecondAndLastElementsOfAString,
	uniqueCode,
} from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

import {
	AddStaffAddressDto,
	AdminLoginDto,
	CreateAdminDto,
	CreatePurchaserDto,
	CreateRoleDto,
	EditSettingsDto,
	UpdateAdminProfileDto,
	UpdateRoleDto,
} from "./adminConfig.dto";
import { hashPassword } from "@/utils/helpers/token";
import { StatusMessages, UserTypes } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import cloudUploader from "@/utils/config/cloudUploader";
import MailService from "../mail/mail.service";
import { endOfToday } from "date-fns";
import orderModel from "../order/order.model";
import productModel from "../product/product.model";
import orderDetailsModel from "../order/orderDetails.model";
import { backDaterArray, FacetStage } from "@/utils/interfaces/base.interface";
import { start } from "repl";
import adminModel from "./admin.model";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import roleModel from "./role.model";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import { requestProp } from "../mail/mail.interface";
import envConfig from "@/utils/config/env.config";
import {
	catchBlockResponse,
	catchBlockResponseFn,
} from "@/utils/constants/data";
import bankModel from "../transaction/bank.model";
import { bankSeedData } from "@/utils/seeders/bank.data";
import settingModel from "./setting.model";

class AdminConfigService {
	private Bank = bankModel;
	private Admin = adminModel;
	private Product = productModel;
	private Role = roleModel;
	private Setting = settingModel;

	public async adminLogin(payload: AdminLoginDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const admin = await this.Admin.findOne({
				Email: payload.email.toLowerCase(),
			});
			if (!admin) {
				responseData.message = "Invalid Credentials";
				return responseData;
			}
			const isPasswordCorrect = await comparePassword(
				payload.password,
				admin.Password
			);
			if (isPasswordCorrect !== true) {
				responseData.message = "Invalid Credentials";
				return responseData;
			}
			const token = createToken(admin);
			admin.Token = token;
			responseData = {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Login Successful",
				data: admin,
			};
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ error:", error);
			(responseData.code = HttpCodesEnum.HTTP_SERVER_ERROR),
				(responseData.message = "Unable To Treat Request At This Time");
			return responseData;
		}
	}

	public async seedSuperAdmin(): Promise<any> {
		try {
			const admins = await this.Admin.countDocuments();
			if (admins > 0) {
				console.log(
					"🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ admins:",
					admins
				);
				return;
			}
			const sotoAdmin = await this.Admin.create({
				FirstName: "soto",
				LastName: "admin",
				Email: "soto@gmail.com",
				Password: await hashPassword("Password@123"),
			});
			const Token = await createToken(sotoAdmin);
			sotoAdmin.Token = Token;
			await sotoAdmin.save();
			console.log(
				"🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ sotoAdmin.createdAt:",
				sotoAdmin.createdAt
			);

			return;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ error:", error);
			return;
		}
	}

	public async seedConfigSetting(): Promise<any> {
		try {
			const configSettings = await this.Setting.countDocuments();
			if (configSettings > 0) {
				console.log(
					"🚀 ~ AdminOverviewService ~ configSettings ~ total configSettings:",
					configSettings
				);
				return;
			}
			const configNew = await this.Setting.create({
				interest_rates: {
					flat: 5,
				},
			});
			console.log(
				"🚀 ~ AdminConfigService ~ seedConfigSetting ~ configNew:",
				configNew
			);

			return;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ seedBanks ~ error:", error);
			return;
		}
	}
	public async seedBanks(): Promise<any> {
		try {
			const banks = await this.Bank.countDocuments();
			if (banks > 0) {
				console.log(
					"🚀 ~ AdminOverviewService ~ seedBanks ~ total banks:",
					banks
				);
				return;
			}
			const bankSeed = bankSeedData.map(
				({ id, createdAt, updatedAt, ...rest }) => rest
			);
			const insertBanks = await this.Bank.insertMany(bankSeed);
			console.log(
				"🚀 ~ AdminOverviewService ~ seedBanks ~ insertBanks.total:",
				insertBanks.length
			);

			return;
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ seedBanks ~ error:", error);
			return;
		}
	}

	public async createAdmin(payload: CreateAdminDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const existingAdmin = await this.Admin.findOne({
				Email: payload.email.toLowerCase(),
			});
			if (existingAdmin) {
				responseData.message = "Admin With Same Email already exists";
				return responseData;
			}
			const role = await this.Role.findById("673c9cf44e37eeaa3697b8d6");
			const uniqueId = role
				? await generateUnusedAdminId(role)
				: genAphaNumericCode(5);
			const sotoAdmin = await this.Admin.create({
				FirstName: payload.first_name,
				LastName: payload.last_name,
				Email: payload.email.toLowerCase(),
				...(payload.phone_number && {
					PhoneNumber: payload.phone_number,
				}),
				Password: await hashPassword("Password@123"),
				Role: payload.role,
				UniqueId: uniqueId,
			});
			const Token = await createToken(sotoAdmin);
			sotoAdmin.Token = Token;
			await sotoAdmin.save();
			console.log(
				"🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ sotoAdmin.createdAt:",
				sotoAdmin.createdAt
			);
			const addressDetails: AddStaffAddressDto = {
				admin: sotoAdmin,
				address: payload.address,
				city: payload.city,
				postal_code: payload.postal_code,
				state: payload.state,
				country: payload.country,
			};
			this.addAddressDetails(addressDetails);

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_CREATED,
				message: "Admin Created Successfully",
				data: sotoAdmin,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ error:", error);
			responseData.code = HttpCodesEnum.HTTP_SERVER_ERROR;
			responseData.message = "Unable to perform request at this time";
			return responseData;
		}
	}

	public async createPurchaser(
		payload: CreatePurchaserDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const existingPurchaser = await this.Admin.findOne({
				Email: payload.email.toLowerCase(),
				Role: "673c9cf44e37eeaa3697b8d6",
			});
			if (existingPurchaser) {
				responseData.message = "Purchaser With Same Email already exists";
				return responseData;
			}
			let profileImage = "";
			if (payload.passport) {
				const url = await cloudUploader.imageUploader(payload.passport);
				profileImage = url ? url : "";
			}
			const role = await this.Role.findById("673c9cf44e37eeaa3697b8d6");
			const password = payload.password || "Password@123";
			const uniqueId = role
				? await generateUnusedAdminId(role)
				: genAphaNumericCode(5);
			const sotoPurchaser = await this.Admin.create({
				FirstName: payload.first_name.toLowerCase().trim(),
				LastName: payload.last_name.toLowerCase().trim(),
				Email: payload.email.toLowerCase(),
				...(payload.phone_number && {
					PhoneNumber: payload.phone_number,
				}),
				Password: await hashPassword(password),
				Role: "673c9cf44e37eeaa3697b8d6",
				ProfileImage: profileImage,
				id_number: payload.id_number,
				id_type: payload.id_type,
				UniqueId: uniqueId,
			});
			const Token = await createToken(sotoPurchaser);
			sotoPurchaser.Token = Token;
			await sotoPurchaser.save();
			console.log(
				"🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ sotoAdmin.createdAt:",
				sotoPurchaser.createdAt
			);
			const addressDetails: AddStaffAddressDto = {
				admin: sotoPurchaser,
				address: payload.address,
				city: payload.city,
				postal_code: "100314",
				state: payload.state || "Lagos",
				country: payload.country,
			};
			this.addAddressDetails(addressDetails);

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_CREATED,
				message: "Purchaser Created Successfully",
				data: sotoPurchaser,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ error:", error);
			responseData.code = HttpCodesEnum.HTTP_SERVER_ERROR;
			responseData.message = "Unable to perform request at this time";
			return responseData;
		}
	}

	public async addAddressDetails(
		payload: AddStaffAddressDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Address Details Added Successfully",
		};
		try {
			const { admin, address, city, postal_code, state, country } = payload;
			console.log(
				"🚀 ~ AdminConfigService addAddressDetails ~ payload:",
				payload
			);
			const body = {
				first_name: admin.FirstName,
				last_name: admin.FirstName,
				email: admin.Email,
				phone: formatPhoneNumber(admin.PhoneNumber),
				line1: address,
				city,
				country: "NG",
				state,
				zip: postal_code,
			};

			const axiosConfig: requestProp = {
				method: "POST",
				url: envConfig.TERMINAL_AFRICA_BASE_URL + `/addresses`,
				body: body,
				headers: {
					authorization: `Bearer ${envConfig.TERMINAL_AFRICA_SECRET_KEY}`,
				},
			};
			const createAddressCall = await axiosRequestFunction(axiosConfig);
			if (createAddressCall.status === StatusMessages.error) {
				return createAddressCall;
			}
			const addressData: any = createAddressCall.data.data;
			const addressUpdate = {
				coordinate: [
					addressData?.coordinates?.lng,
					addressData?.coordinates?.lat,
				],
				address_details: {
					full_address: `${address}, ${city}, ${state}, ${country}`,
					address,
					address_id: addressData.address_id,
					city: addressData.city,
					coordinates: addressData.coordinates,
					country,
					postal_code,
				},
				address_id: addressData.address_id,
			};

			const updatedAddress = await this.Admin.findByIdAndUpdate(
				admin._id,
				addressUpdate,
				{ new: true }
			);
			responseData.data = updatedAddress;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService addAddressDetails~ error:", error);
			return catchBlockResponse;
		}
	}

	public async createRole(payload: CreateRoleDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const existingRole = await this.Role.findOne({
				name: payload.name.toLowerCase(),
			});
			if (existingRole) {
				responseData.message = "Role With Same Email already exists";
				return responseData;
			}
			const alias = getFirstSecondAndLastElementsOfAString(
				payload.name
			).toUpperCase();
			const role = await this.Role.create({
				...payload,
				alias,
			});

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_CREATED,
				message: "Role Created Successfully",
				data: role,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ createRole ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async fetchRoles(
		limit: number,
		page: number,
		search?: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			let records = await getPaginatedRecords(this.Role, {
				limit,
				page,
				...(search && {
					data: { name: { $regex: search, $options: "i" } },
				}),
			});

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Roles fetched Successfully",
				data: records,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ fetchRoles ~ error:", error);
			responseData.code = HttpCodesEnum.HTTP_SERVER_ERROR;
			responseData.message = "Unable to perform request at this time";
			return responseData;
		}
	}

	public async updateRole(
		payload: UpdateRoleDto,
		id: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const existingRole = await this.Role.findById(id);
			if (!existingRole) {
				responseData.message = "Role Not Found";
				return responseData;
			}
			const updatedRole = await this.Role.findByIdAndUpdate(
				id,
				{
					...(payload.name && { name: payload.name.toLowerCase() }),
					...(payload.admin && {
						admin: {
							read: payload.admin?.read
								? payload?.admin?.read
								: existingRole?.admin?.read,
							write: payload.admin?.write
								? payload?.admin?.write
								: existingRole?.admin?.write,
						},
					}),
					...(payload.config && {
						config: {
							read: payload.config?.read
								? payload?.config?.read
								: existingRole?.config?.read,
							write: payload.config?.write
								? payload?.config?.write
								: existingRole?.config?.write,
						},
					}),
					...(payload.order && {
						order: {
							read: payload.order?.read
								? payload?.order?.read
								: existingRole?.order?.read,
							write: payload.order?.write
								? payload?.order?.write
								: existingRole?.order?.write,
						},
					}),
					...(payload.buyer && {
						buyer: {
							read: payload.buyer?.read
								? payload?.buyer?.read
								: existingRole?.buyer?.read,
							write: payload.buyer?.write
								? payload?.buyer?.write
								: existingRole?.buyer?.write,
						},
					}),
					...(payload.seller && {
						seller: {
							read: payload.seller?.read
								? payload?.seller?.read
								: existingRole?.seller?.read,
							write: payload.seller?.write
								? payload?.seller?.write
								: existingRole?.seller?.write,
						},
					}),
					...(payload.product && {
						product: {
							read: payload.product?.read
								? payload?.product?.read
								: existingRole?.product?.read,
							write: payload.product?.write
								? payload?.product?.write
								: existingRole?.product?.write,
						},
					}),
					...(payload.admin && {
						admin: {
							read: payload.admin?.read
								? payload?.admin?.read
								: existingRole?.admin?.read,
							write: payload.admin?.write
								? payload?.admin?.write
								: existingRole?.admin?.write,
						},
					}),
					...(payload.transaction && {
						transaction: {
							read: payload.transaction?.read
								? payload?.transaction?.read
								: existingRole?.transaction?.read,
							write: payload.transaction?.write
								? payload?.transaction?.write
								: existingRole?.transaction?.write,
						},
					}),
				},
				{ new: true }
			);

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Role updated Successfully",
				data: updatedRole,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ updateRole ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async getStaffs(
		limit: number,
		page: number,
		search?: string,
		role?: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const data = {
				...((search || role) && {
					$and: [
						{
							...(search && {
								$or: [
									{ FirstName: { $regex: search, $options: "i" } },
									{ LastName: { $regex: search, $options: "i" } },
									{ Email: { $regex: search, $options: "i" } },
									{ PhoneNumber: { $regex: search, $options: "i" } },
								],
							}),
						},
						{
							...(role && { Role: role }),
						},
					],
				}),
			};
			let records = await getPaginatedRecords(this.Admin, {
				limit,
				page,
				data,
				populateObj: {
					path: "Role",
					select: "name _id",
				},
			});

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Staffs fetched Successfully",
				data: records,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ fetchRoles ~ error:", error);
			responseData.code = HttpCodesEnum.HTTP_SERVER_ERROR;
			responseData.message = "Unable to perform request at this time";
			return responseData;
		}
	}

	public async updateStaffRole(
		staff_id: string,
		role_id: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const existingRole = await this.Role.findById(role_id);
			if (!existingRole) {
				responseData.message = "Role Not Found";
				return responseData;
			}
			const existingStaff = await this.Admin.findById(staff_id);
			if (!existingStaff) {
				responseData.message = "Staff Not Found";
				return responseData;
			}
			const updatedStaffRole = await this.Admin.findByIdAndUpdate(
				staff_id,
				{
					Role: role_id,
				},
				{ new: true }
			);

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Staff Role updated Successfully",
				data: updatedStaffRole,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ updateStaffRole ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async getProfile(
		admin: InstanceType<typeof this.Admin>
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			const fullDetails = await this.Admin.findById(admin._id).populate("Role");
			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Profile updated Successfully",
				data: fullDetails,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ getProfile ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async editProfile(
		admin: InstanceType<typeof this.Admin>,
		payload: UpdateAdminProfileDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodesEnum.HTTP_BAD_REQUEST,
			message: "Error",
		};
		try {
			let image: string | undefined = payload.profile_image
				? await cloudUploader.imageUploader(payload.profile_image)
				: undefined;

			const updateProfile = await this.Admin.findByIdAndUpdate(
				admin._id,
				{
					...(payload?.first_name && {
						FirstName: payload.first_name.toLowerCase(),
					}),
					...(payload?.last_name && {
						LastName: payload.last_name.toLowerCase(),
					}),
					...(payload?.first_name && {
						FirstName: payload.first_name.toLowerCase(),
					}),
					...(payload?.email && {
						Email: payload.email.toLowerCase(),
					}),
					...(payload?.phone_number && {
						PhoneNumber: formatPhoneNumber(payload.phone_number),
					}),
					...(payload?.password && {
						Password: hashPassword(payload.password),
					}),
					...(image && {
						ProfileImage: image,
					}),
				},
				{ new: true }
			);
			if (
				payload?.city ||
				payload?.address ||
				payload?.state ||
				payload?.city
			) {
				const addressDetails: AddStaffAddressDto = {
					admin: admin,
					address: payload.address || admin.address_details?.address || "lagos",
					city: payload?.city || admin.address_details?.city || "lagos",
					state: payload.state || admin.address_details?.state || "lagos",
					postal_code: payload.postal_code,
					country: payload?.country || admin.address_details?.country,
				};
				this.addAddressDetails(addressDetails);
			}

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_OK,
				message: "Profile updated Successfully",
				data: updateProfile,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ editProfile ~ error:", error);
			return catchBlockResponse;
		}
	}

	public async getConfigSettings(): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "Settngs retreived successfully",
		};
		try {
			const settings = await this.Setting.findOne({});
			if (!settings) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_OK,
					message: "Settings not found",
				};
			}

			responseData.data = settings;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ editProfile ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async editConfigSettings(
		payload: EditSettingsDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodesEnum.HTTP_OK,
			message: "Settngs edited successfully",
		};
		try {
			const {
				address,
				city,
				state,
				postal_code,
				withdrawals_frequency,
				withdrawals_manual,
				withdrawals_scheduled,
				interest_rates_flat,
				interest_rates_special,
			} = payload;
			const configSettings = await this.Setting.findOne({});
			if (!configSettings) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_OK,
					message: "Settings not found",
				};
			}
			const shiping_address_update = {
				address: address ? address : configSettings.ShippingAddress?.address,
				city: city ? city : configSettings.ShippingAddress?.city,
				state: state ? state : configSettings.ShippingAddress?.state,
				postal_code: postal_code
					? postal_code
					: configSettings.ShippingAddress?.postal_code,
			};
			const editedSettings = await this.Setting.findByIdAndUpdate(
				configSettings._id,
				{
					ShippingAddress: {
						full_address: `${shiping_address_update.address}, ${shiping_address_update.city}, ${shiping_address_update.state},`,
						...shiping_address_update,
					},
					withdrawals: {
						manual: withdrawals_manual
							? withdrawals_manual
							: configSettings.withdrawals?.manual,
						scheduled: withdrawals_scheduled
							? withdrawals_scheduled
							: configSettings.withdrawals?.scheduled,
						frequency: withdrawals_frequency
							? withdrawals_frequency
							: configSettings.withdrawals?.frequency,
					},
					interest_rates: {
						flat: interest_rates_flat
							? interest_rates_flat
							: configSettings.interest_rates?.flat,
						special: interest_rates_special
							? interest_rates_special
							: configSettings.interest_rates?.special,
					},
				},
				{ new: true }
			);

			if (interest_rates_flat) {
				this.updateAllProductPrices(interest_rates_flat);
			}
			responseData.data = editedSettings;
			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ editProfile ~ error:", error);
			return catchBlockResponseFn(error);
		}
	}

	public async updateAllProductPrices(rate: number) {
		try {
			const multiplier = 1 + rate / 100;
			const result = await this.Product.updateMany({}, [
				{
					$set: {
						unit_price: {
							$multiply: [
								{
									$round: [
										{
											$divide: [{ $multiply: ["$raw_price", multiplier] }, 50],
										},
										0,
									],
								},
								50,
							],
						},
					},
				},
			]);
			console.log(
				"🚀 ~ AdminConfigService ~ updateAllProductPrices ~ result:",
				result
			);
			return result;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminConfigService ~ updateAllProductPrices ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}
}

export default AdminConfigService;
