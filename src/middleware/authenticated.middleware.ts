import userModel from "@/resources/user/user.model";
import HttpException from "@/utils/exceptions/http.exception";
import Token from "@/utils/interfaces/token.interface";
import { verifyToken } from "@/utils/token";
import { Request, Response, NextFunction } from "express";
import jwt, { verify } from "jsonwebtoken";
import axios from "axios";


async function authenticatedMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith("Bearer ")) {
        // return res.status(401).json({error:"Unauthorized"});
        return next(new HttpException(401, "Unauthorized"));

    }

    const accessToken = bearer.split("Bearer ")[1].trim();
    try {
        const payload:Token|jwt.JsonWebTokenError=await verifyToken(accessToken);
        if(payload instanceof jwt.JsonWebTokenError ){
            // return res.status(401).json({error:"Unauthorized"});
            return next(new HttpException(401,"Unauthorized"));
    
        }
        
        const user=await userModel.findById(payload.id);
    if(!user){
        return next(new HttpException(401,"Unauthorized"));
    }

        req.user = user;
        next();
    } catch (error) {
        return next(new HttpException(401, "Unauthorized"));

    }

}

export default authenticatedMiddleware;