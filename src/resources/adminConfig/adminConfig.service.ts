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
	AdminLoginDto,
	CreateAdminDto,
	CreateBusinessDto,
	CreateRoleDto,
	OverviewDto,
	VerificationDto,
} from "./adminConfig.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	UserTypes,
} from "@/utils/enums/base.enum";
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

class AdminConfigService {
	private User = UserModel;
	private Order = orderModel;
	private Product = productModel;
	private OrderDetails = orderDetailsModel;
	private Admin = adminModel;
	private Role = roleModel;

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
			const sotoAdmin = await this.Admin.create({
				FirstName: payload.first_name,
				LastName: payload.last_name,
				Email: payload.email.toLowerCase(),
				...(payload.phone_number && {
					PhoneNumber: payload.phone_number,
				}),
				Password: await hashPassword("Password@123"),
				Role: payload.role,
			});
			const Token = await createToken(sotoAdmin);
			sotoAdmin.Token = Token;
			await sotoAdmin.save();
			console.log(
				"🚀 ~ AdminOverviewService ~ seedSuperAdmin ~ sotoAdmin.createdAt:",
				sotoAdmin.createdAt
			);

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
			const role = await this.Role.create({
				...payload,
			});

			return {
				status: StatusMessages.success,
				code: HttpCodesEnum.HTTP_CREATED,
				message: "Role Created Successfully",
				data: role,
			};
		} catch (error: any) {
			console.log("🚀 ~ AdminConfigService ~ createRole ~ error:", error);
			responseData.code = HttpCodesEnum.HTTP_SERVER_ERROR;
			responseData.message = "Unable to perform request at this time";
			return responseData;
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
}

export default AdminConfigService;
