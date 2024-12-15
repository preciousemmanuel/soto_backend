import userModel from "@/resources/user/user.model";
import HttpException from "@/utils/exceptions/http.exception";
import Token from "@/utils/interfaces/token.interface";
import { verifyToken } from "@/utils/helpers/token";
import { Request, Response, NextFunction } from "express";
import jwt, { verify } from "jsonwebtoken";
import axios from "axios";
import adminModel from "@/resources/adminConfig/admin.model";

async function genAuthenticatedMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<Response | void> {
	const productPath = req.path.includes("/product/fetch");
	const customOrderPath = req.path.includes("/order/create-custom");
	try {
		const bearer = req.headers.authorization || "Bearer abcdef";

		if (!bearer || !bearer.startsWith("Bearer ")) {
			if ((productPath === customOrderPath) === false) {
				return next(new HttpException(401, "Unauthorized"));
			} else {
				return next();
			}
		}

		const accessToken = bearer.split("Bearer ")[1].trim();

		const payload =
			accessToken !== "abcdef" ? await verifyToken(accessToken) : undefined;
		if (payload && payload instanceof jwt.JsonWebTokenError) {
			if ((productPath === customOrderPath) === false) {
				return next(new HttpException(401, "Unauthorized"));
			}
			return next(); // Allow through for `/product/fetch`
		} else {
			const user = await userModel
				.findById(payload?.id)
				.populate("business")
				.populate("wallet")
				.populate("cart")
				.populate("card");
			const admin = await adminModel.findById(payload?.id);

			if (!user && !productPath && !customOrderPath && !admin) {
				return next(new HttpException(401, "Unauthorized"));
			} else if (user) {
				req.user = user;
				next();
			} else if (admin) {
				req.admin = admin;
				next();
			} else {
				return next(new HttpException(401, "Unauthorized"));
			}
		}
	} catch (error) {
		console.log("🚀authenticatedMiddleware ~ error:", error);
		if ((productPath === customOrderPath) === false) {
			return next(new HttpException(401, "Unauthorized"));
		}
		next(); // Allow through for `/product/fetch` on error
	}
}

export default genAuthenticatedMiddleware;