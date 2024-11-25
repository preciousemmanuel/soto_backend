import { StatusMessages } from "../enums/base.enum";
import { HttpCodesEnum } from "../enums/httpCodes.enum";
import ResponseData from "../interfaces/responseData.interface";

const status = {
	ACTIVE: "ACTIVE",
	PENDING: "PENDING",
	FAILED: "FAILED",
	SUCCESS: "SUCCESS",
	INACTIVE: "INACTIVE",
	BLOCKED: "BLOCKED",
	APPROVE: "APPROVE",
	DECLINED: "DECLINED",
};

const currency = {
	NGN: "NGN",
	USD: "USD",
};

const cardType = {
	VIRTUAL: "VIRTUAL",
	PHYSICAL: "PHYSICAL",
};

const httpStatusMessage = {
	success: "success",
	error: "error",
};

const catchBlockResponse: ResponseData = {
	status: StatusMessages.error,
	code: HttpCodesEnum.HTTP_SERVER_ERROR,
	message: "Unable To Perform This Request At This Moment",
};

const catchBlockResponseFn = (error: any): ResponseData => {
	return {
		status: StatusMessages.error,
		code: HttpCodesEnum.HTTP_SERVER_ERROR,
		message:
			error.toString() || "Unable To Perform This Request At This Moment",
	};
};

export {
	status,
	currency,
	cardType,
	httpStatusMessage,
	catchBlockResponse,
	catchBlockResponseFn,
};
