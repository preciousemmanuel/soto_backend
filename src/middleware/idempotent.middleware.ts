
import { Request, Response, NextFunction } from "express";
import HttpException from "@/utils/exceptions/http.exception";
import { HttpCodes } from "@/utils/httpcode";

async function idempotentMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    const idempotentKey = req.headers.idempotentkey;
    if (!idempotentKey ) {
        // return res.status(401).json({error:"Unauthorized"});
        return next(new HttpException(HttpCodes.HTTP_FORBIDDEN, "Please provide unique idempotentKey key"));

    }
    next();


}

export default idempotentMiddleware;