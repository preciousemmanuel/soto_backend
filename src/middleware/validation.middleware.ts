import { responseObject } from '@/utils/http.response';
import {Request,Response,NextFunction,RequestHandler}  from 'express';
import Joi from 'joi';


import {HttpCodes} from '@/utils/httpcode'

function validationMiddleware(shema:Joi.Schema):RequestHandler
{
    return async (
        req:Request,
        res:Response,
        next:NextFunction
    ):Promise<void>=>{
        const validationOptions={
            abortEarly:false,
            allowUnknown: true,
            stripUnknown:true
        };

        try {
            const value = await shema.validateAsync(req.body,validationOptions);
            req.body=value;
            next()
        } catch (e:any) {
            const errors:string[] =[];
            e.details.forEach((error:Joi.ValidationErrorItem) => {
                errors.push(error.message);
            });

            responseObject(res,HttpCodes.HTTP_BAD_REQUEST,"error","Validation error",errors);

            
        }
    }
}

export default validationMiddleware;