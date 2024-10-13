import { Response } from "express";


export const responseObject = (response: Response, code: number, status: string,message: string, data?: any, ) => {
    if (!data) {
        return response.status(code).json({
            status,
            message,
        });
    } else {
        return response.status(code).json({
            status,
            // resultCount: data ? data.length : 0,
            data,
            message,
        });
    }
};


export default { responseObject };