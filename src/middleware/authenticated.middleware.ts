import userModel from "@/resources/user/user.model";
import HttpException from "@/utils/exceptions/http.exception";
import Token from "@/utils/interfaces/token.interface";
import { verifyToken } from "@/utils/helpers/token";
import { Request, Response, NextFunction } from "express";
import jwt, { verify } from "jsonwebtoken";
import axios from "axios";


async function authenticatedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const bearer = req.headers.authorization || "Bearer abcdef";
    console.log("🚀 ~ bearer:", bearer);

    if (!bearer || !bearer.startsWith("Bearer ")) {
      if (!req.path.includes('/product/fetch')) {
        return next(new HttpException(401, "Unauthorized"));
      }
      return next(); // Allow through for `/product/fetch`
    }

    const accessToken = bearer.split("Bearer ")[1].trim();
    const productPath = req.path.includes('/product/fetch');
    console.log("🚀 ~ productPath:", productPath);

    const payload = await verifyToken(accessToken);
    if (payload instanceof jwt.JsonWebTokenError) {
      if (!productPath) {
        return next(new HttpException(401, "Unauthorized"));
      }
      return next(); // Allow through for `/product/fetch`
    }

    const user = await userModel.findById(payload.id)
      .populate('business')
      .populate('wallet')
      .populate('cart')
      .populate('card');

    if (!user && !productPath) {
      return next(new HttpException(401, "Unauthorized"));
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("🚀authenticatedMiddleware ~ error:", error);
    if (!req.path.includes('/product/fetch')) {
      return next(new HttpException(401, "Unauthorized"));
    }
    next(); // Allow through for `/product/fetch` on error
  }
}

export default authenticatedMiddleware;