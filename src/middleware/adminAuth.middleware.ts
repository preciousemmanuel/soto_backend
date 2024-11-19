import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import adminModel from "@/resources/adminConfig/admin.model";
import roleModel from "@/resources/adminConfig/role.model";
import Token from "@/utils/interfaces/token.interface";
import { verifyToken } from "@/utils/helpers/token";
import HttpException from "@/utils/exceptions/http.exception";
import { ReadWriteDto } from "@/utils/interfaces/base.interface";
import {
	AccessControlOptions,
	AdminPermissions,
	AllowOrDeny,
	YesOrNo,
} from "@/utils/enums/base.enum";
import { Role } from "@/resources/adminOverview/adminOverview.interface";

function adminAuthMiddleware(
	permission_type: AdminPermissions,
	access_control: AccessControlOptions
) {
	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		const bearer = req.headers.authorization;

		if (!bearer || !bearer.startsWith("Bearer ")) {
			return next(new HttpException(401, "Unauthorized"));
		}

		const accessToken = bearer.split("Bearer ")[1].trim();

		try {
			const payload: Token | JsonWebTokenError = await verifyToken(accessToken);

			if (payload instanceof JsonWebTokenError) {
				return next(new HttpException(401, "Unauthorized"));
			}

			const admin = await adminModel.findById(payload.id);
			const role = await roleModel.findById(admin?.Role);

			if (!admin) {
				return next(new HttpException(401, "Unauthorized"));
			}

			req.admin = admin;
			const is_allowed = role
				? checkPermission(role, access_control, permission_type)
				: AllowOrDeny.DENIED;

			if (is_allowed === AllowOrDeny.DENIED) {
				return next(
					new HttpException(403, "Forbidden: Insufficient permissions")
				);
			}

			next();
		} catch (error) {
			return next(new HttpException(401, "Unauthorized"));
		}
	};
}

const checkPermission = (
	role: Role | any,
	access_control: string,
	permission: string
): string => {
	try {
		let permit: string = YesOrNo.NO,
			response: string;
		switch (permission) {
			case AdminPermissions.ADMIN:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.admin?.read === YesOrNo.YES
								? role.admin?.read
								: role.admin?.write || YesOrNo.NO;
						break;
					default:
						permit = role.admin?.write || YesOrNo.NO;
						break;
				}
				break;
			case AdminPermissions.CONFIG:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.config?.read === YesOrNo.YES
								? role.config?.read
								: role.config?.write || YesOrNo.NO;
						break;
					default:
						permit = role.config?.write || YesOrNo.NO;
						break;
				}
				break;
			case AdminPermissions.ORDER:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.order?.read === YesOrNo.YES
								? role.order?.read
								: role.order?.write || YesOrNo.NO;
						break;
					default:
						permit = role.order?.write || YesOrNo.NO;
						break;
				}
				break;
			case AdminPermissions.BUYER:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.buyer?.read === YesOrNo.YES
								? role.buyer?.read
								: role.buyer?.write || YesOrNo.NO;
						break;
					default:
						permit = role.buyer?.write || YesOrNo.NO;
						break;
				}
				break;
			case AdminPermissions.SELLER:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.seller?.read === YesOrNo.YES
								? role.seller?.read
								: role.seller?.write || YesOrNo.NO;
						break;
					default:
						permit = role.seller?.write || YesOrNo.NO;
						break;
				}
				break;
			case AdminPermissions.PRODUCT:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.product?.read === YesOrNo.YES
								? role.product?.read
								: role.product?.write || YesOrNo.NO;
						break;
					default:
						permit = role.product?.write || YesOrNo.NO;
						break;
				}
				break;
			case AdminPermissions.TRANSACTION:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.transaction?.read === YesOrNo.YES
								? role.transaction?.read
								: role.transaction?.write || YesOrNo.NO;
						break;
					default:
						permit = role.transaction?.write || YesOrNo.NO;
						break;
				}
				break;
			default:
				switch (access_control) {
					case AccessControlOptions.READ:
						permit =
							role.admin?.read === YesOrNo.YES
								? role.admin?.read
								: role.admin?.write || YesOrNo.NO;
						break;
					default:
						permit = role.admin?.write || YesOrNo.NO;
						break;
				}
				break;
		}

		if (permit === YesOrNo.YES) {
			response = AllowOrDeny.ALLOWED;
		} else {
			response = AllowOrDeny.DENIED;
		}
		console.log("🚀 ~check permission response:", response);
		return response;
	} catch (error) {
		console.log("🚀 ~check permission error:", error);
		return AllowOrDeny.DENIED;
	}
};

export default adminAuthMiddleware;
