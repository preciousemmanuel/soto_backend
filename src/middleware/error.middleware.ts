import { Request,Response ,NextFunction} from "express";
import HttpException from "@/utils/exceptions/http.exception";
import { responseObject } from "@/utils/http.response";


function errorMiddleware(
    error:HttpException,
    req:Request,
    res:Response,
    next:NextFunction
    ):void{
        const status=error.status||500;
        const message=error.message||"Something went wrong";

        responseObject(res,status,"error",message);
       // res.status(status).send(message);
    }

    export default errorMiddleware;