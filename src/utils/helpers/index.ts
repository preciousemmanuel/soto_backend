import { requestProp } from "@/resources/mail/mail.interface";
import ResponseData from "../interfaces/responseData.interface";
import axios, { AxiosRequestConfig, Method } from "axios";
import { StatusMessages, Timeline } from "../enums/base.enum";
import { HttpCodes } from "../constants/httpcode";
import orderModel from "@/resources/order/order.model";
import {
	endOfDay,
	startOfDay,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
} from "date-fns";
import {
	backDaterArray,
	BackDaterResponse,
} from "../interfaces/base.interface";
import genCouponModel from "@/resources/coupon/genCoupon.model";
import productModel from "@/resources/product/product.model";
import roleModel from "@/resources/adminConfig/role.model";
import adminModel from "@/resources/adminConfig/admin.model";

export const uniqueCode = (): number => {
	const code = Math.floor(1000 + Math.random() * 9000);
	return code;
};

export const processAxiosErrorFromCatch = (error: any) => {
	if (error.response) {
		// The request was made and the server responded with a status code
		console.error("Response data:", error.response.data);
		console.error("Response status:", error.response.status);
		console.error("Response headers:", error.response.headers);
		return;
	} else if (error.request) {
		// The request was made but no response was received
		console.error("Request:", error.request);
	} else {
		// Something happened in setting up the request that triggered an error
		console.error("Error:", error.message);
	}
};

export const isObjectEmpty = (obj: object) => {
	return Object.entries(obj).length === 0;
};

export const verificationCode = () => {
	const code = Math.floor(1000 + Math.random() * 9000);
	return code;
};

export const formatPhoneNumber = (phone_number: string) => {
	const stringed = String(phone_number);
	let formated;
	formated = "+234" + stringed.slice(-10);
	return formated;
};

export const genAphaNumericCode = (length?: number) => {
	//define a variable consisting alphabets in small and capital letter
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
	var number = Math.floor(Math.random() * 10000);
	//specify the length for the new string
	var lenString = length || 3;
	var string = "";
	//loop to select a new character in each iteration
	for (var i = 0; i < lenString; i++) {
		var rnum = Math.floor(Math.random() * characters.length);
		string += characters.substring(rnum, rnum + 1);
	}
	var randomstring = `${number}` + string;
	//display the generated string
	return randomstring;
};

export const convertNairaToKobo = (amount: number) => {
	const koboValue = Number(amount) * 100;
	return koboValue;
};

export const getFirstSecondAndLastElementsOfAString = (str: string): string => {
	try {
		let name: string;
		if (str.length >= 2) {
			const firstChar = str[0];
			const secondChar = str[1];
			const lastChar = str[str.length - 1];
			name = firstChar + secondChar + lastChar;
		} else if (str.length === 1) {
			name = str[0];
		} else {
			name = "";
		}
		console.log("🚀 ~ getFirstSecondAndLastElementsOfAString ~ name:", name);
		return name;
	} catch (error: any) {
		console.log("🚀 ~ getFirstSecondAndLastElementsOfAString ~ error:", error);
		return error.toString();
	}
};

export const axiosRequestFunction = async ({
	url,
	method,
	params,
	body,
	headers,
}: requestProp): Promise<ResponseData> => {
	let responseData: ResponseData = {
		status: StatusMessages.success,
		code: HttpCodes.HTTP_OK,
		message: "",
		data: null,
	};
	try {
		const config: AxiosRequestConfig = {
			method: method,
			url: url,
			...(body && { data: body }),
			...(params && { params: params }),
			...(headers && { headers: headers }),
		};

		await axios(config)
			.then((response) => {
				responseData = {
					status: StatusMessages.success,
					code: HttpCodes.HTTP_OK,
					message: response.statusText,
					data: response?.data,
				};
			})
			.catch((e) => {
				console.log("🚀 AXIOS CATCH ERROR", e);
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: e?.response?.data?.message || e.toString(),
					data: null,
				};
			});
		return responseData;
	} catch (error: any) {
		console.log("🚀 ~ error:", error);
		responseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: error.toString(),
			data: null,
		};
	}
	return responseData;
};

export const getRandomRef = () => {
	const getRef = () => {
		var nums = "0123456789";
		var rand = "";
		for (var i = 0; i < 5; i++) {
			rand += nums[Math.floor(Math.random() * 10)];
		}
		return rand;
	};
	let randRef = "SOTO" + getRef() + Date.now();

	return randRef;
};

export const generateUnusedOrderId = async (): Promise<string> => {
	let order_id: string;
	let existingOrderWithId: any;
	let generatedOrderId: string;
	let randString: string;
	try {
		randString = String(genAphaNumericCode());
		generatedOrderId = String(`ST${randString}`);
		existingOrderWithId = await orderModel.findOne({
			tracking_id: generatedOrderId,
		});
		order_id = generatedOrderId;
		while (existingOrderWithId !== null && existingOrderWithId !== undefined) {
			randString = String(genAphaNumericCode());
			generatedOrderId = String(`ST${randString}`);
			existingOrderWithId = await orderModel.findOne({
				tracking_id: generatedOrderId,
			});
			order_id = generatedOrderId;
		}
		return order_id;
	} catch (error: any) {
		console.log("🚀 ~ generateUnusedOrderId ~ error:", error);
		return error.toString();
	}
};

export const generateUnusedProductCode = async (): Promise<string> => {
	let order_id: string;
	let existingOrderWithId: any;
	let generatedOrderId: string;
	let randString: string;
	try {
		randString = String(genAphaNumericCode(2));
		generatedOrderId = String(`PRD-${randString}`);
		existingOrderWithId = await orderModel.findOne({
			tracking_id: generatedOrderId,
		});
		order_id = generatedOrderId;
		while (existingOrderWithId !== null && existingOrderWithId !== undefined) {
			randString = String(genAphaNumericCode(2));
			generatedOrderId = String(`PRD-${randString}`);
			existingOrderWithId = await productModel.findOne({
				product_code: generatedOrderId,
			});
			order_id = generatedOrderId;
		}
		return order_id;
	} catch (error: any) {
		console.log("🚀 ~ generateUnusedProductCode ~ error:", error);
		return error.toString();
	}
};

export const genCouponCode = () => {
	//define a variable consisting alphabets in small and capital letter
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
	var number = Math.floor(Math.random() * 10000);
	//specify the length for the new string
	var lenString = 2;
	var string = "";
	//loop to select a new character in each iteration
	for (var i = 0; i < lenString; i++) {
		var rnum = Math.floor(Math.random() * characters.length);
		string += characters.substring(rnum, rnum + 1);
	}
	var randomstring = `SCC${number}` + string;
	//display the generated string
	return randomstring;
};

export const generateUnusedCoupon = async (): Promise<string> => {
	let generatedCouponCode: string;
	let existingCouponWithCode: any;
	let finalCouponCode: string;
	try {
		generatedCouponCode = String(genCouponCode());
		existingCouponWithCode = await genCouponModel.findOne({
			code: generatedCouponCode,
		});
		finalCouponCode = generatedCouponCode;
		while (
			existingCouponWithCode !== null &&
			existingCouponWithCode !== undefined
		) {
			existingCouponWithCode = await genCouponModel.findOne({
				code: generatedCouponCode,
			});
			finalCouponCode = generatedCouponCode;
		}
		return finalCouponCode;
	} catch (error: any) {
		console.log("🚀 ~ generateUnusedCoupon ~ error:", error);
		return error.toString();
	}
};

export const backDaterForChart = async (
	payload: any
): Promise<BackDaterResponse> => {
	const { input, format } = payload;

	switch (format) {
		case Timeline.TODAY:
			var datet = input ? new Date(input) : new Date();
			let day1: Date = datet;
			var start = startOfDay(day1);
			var end = endOfDay(day1);
			var object1 = {
				start,
				end,
				day: new Date(day1).toDateString(),
				raw_date: new Date(day1),
			};
			return {
				format: "Today",
				array: [object1],
			};
			break;
		case Timeline.YESTERDAY:
			var datey = input ? new Date(input) : new Date();
			let day2y = new Date(datey.setDate(datey.getDate() - 1));
			var start = startOfDay(day2y);
			var end = endOfDay(day2y);
			var object2 = {
				start,
				end,
				day: new Date(day2y).toDateString(),
				raw_date: new Date(day2y),
			};

			return {
				format: "Yesterday",
				array: [object2],
			};
			break;
		case Timeline.THIS_WEEK:
			var datew = input ? new Date(input) : new Date();
			let i = 1,
				array = [],
				set,
				object3,
				startDay = startOfWeek(datew);

			object3 = {
				start: startOfDay(startDay),
				end: endOfDay(startDay),
				day: startDay.toDateString(),
				raw_date: new Date(startDay),
			};
			array.push(object3);
			while (i < 7) {
				set = new Date(startDay.setDate(startDay.getDate() + i));
				object3 = {
					start: startOfDay(set),
					end: endOfDay(set),
					day: set.toDateString(),
					raw_date: new Date(set),
				};
				array.push(object3);
				i += 1;
				startDay = startOfWeek(datew);
			}
			return {
				format: "This Week",
				array,
			};
			break;
		case Timeline.LAST_7_DAYS:
			let i1 = 5;
			const array1 = [];
			const date = input ? new Date(input) : new Date();
			let dateToStart = input ? new Date(input) : new Date();
			let fixed = new Date(dateToStart.setDate(dateToStart.getDate() - 6));
			let startDate = fixed;
			let object = {
				start: startOfDay(fixed),
				end: endOfDay(fixed),
				day: fixed.toDateString(),
				raw_date: new Date(fixed),
			};
			array1.push(object);
			while (i1 > -1) {
				let day = new Date(startDate.setDate(startDate.getDate() + 1));
				var start = startOfDay(day);
				var end = endOfDay(day);
				object = {
					start,
					end,
					day: new Date(day).toDateString(),
					raw_date: new Date(day),
				};
				array1.push(object);
				i1 -= 1;
				startDate = fixed;
			}
			return {
				format: "Last 7 Days",
				array: array1,
			};
			break;
		case Timeline.THIS_MONTH:
			var date2 = input ? new Date(input) : new Date();
			let i2 = 0,
				count = 0;
			const array2 = [];
			const thisArray = [];
			var date2 = input ? new Date(input) : new Date();
			let monthStart = startOfMonth(date2),
				monthEnd = endOfWeek(endOfMonth(date2)),
				gapCalc = Math.round(
					(monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
				),
				day: Date = new Date();
			let gap = gapCalc > 30 ? 30 : gapCalc;
			while (i2 < gap) {
				if (count < 1) {
					const start = monthStart;
					const end = endOfWeek(monthStart);
					day = new Date(monthStart);
					const dateObject = {
						start,
						end,
						day: day.toDateString(),
						raw_date: new Date(day),
					};
					array2.unshift(dateObject);
					thisArray.unshift(dateObject);
					i2 += 7;
					count += 1;
					day = new Date(monthStart.setDate(monthStart.getDate() + i2));
					monthStart = startOfMonth(date2);
				} else if (endOfWeek(day) <= monthEnd) {
					const start = startOfWeek(day);
					const end = endOfWeek(day);
					const object = {
						start,
						end,
						day: new Date(day).toDateString(),
						raw_date: new Date(day),
					};
					array2.push(object);
					i2 += 7;
					count += 1;
				} else {
					const start = startOfWeek(day);
					const end = endOfWeek(day);
					const object = {
						start,
						end,
						day: new Date(day).toDateString(),
						raw_date: new Date(day),
					};
					if (end < monthEnd) {
						array2.push(object);
					}
					i2 += 7;
					count += 1;
				}
				monthStart = startOfMonth(date2);
				day = new Date(monthStart.setDate(monthStart.getDate() + i2));
				monthStart = startOfMonth(date2);
			}

			array2[0].start = monthStart;
			return {
				format: "This Month",
				array: array2,
			};
			break;
		case Timeline.LAST_6_MONTHS:
			var date6m = input ? new Date(input) : new Date();
			let i6m = 5;
			const array6m = [];
			var date6m = input ? new Date(input) : new Date();
			var fixed6m = date6m;
			while (i6m > -1) {
				const day = new Date(fixed6m.setMonth(fixed6m.getMonth() - i6m));
				fixed6m = input ? new Date(input) : new Date();
				const start = startOfMonth(day);
				const end = endOfMonth(day);
				const object = {
					start,
					end,
					month: new Date(day).toDateString(),
					raw_date: new Date(day),
				};
				array6m.push(object);
				i6m -= 1;
			}
			return {
				format: "Last 6 Months",
				array: array6m,
			};
			break;
		case Timeline.LAST_12_MONTHS:
			let i12m = 11;
			const array12m = [];
			const date12m = input ? new Date(input) : new Date();
			let fixed12m = date12m;
			while (i12m > -1) {
				const day = new Date(fixed12m.setMonth(fixed12m.getMonth() - i12m));
				fixed12m = input ? new Date(input) : new Date();
				const start = startOfMonth(day);
				const end = endOfMonth(day);
				const object = {
					start,
					end,
					month: new Date(day).toDateString(),
					raw_date: new Date(day),
				};
				array12m.push(object);
				i12m -= 1;
			}
			return {
				format: "Last 12 Months",
				array: array12m,
			};
			break;
		case Timeline.LAST_2_YEARS:
			let i2y = 2;
			const array2y = [];
			var date2y = input ? new Date(input) : new Date();
			let fixed2y = date2y;
			while (i2y > -1) {
				const day = new Date(fixed2y.setFullYear(fixed2y.getFullYear() - i2y));
				fixed2y = input ? new Date(input) : new Date();
				const start = startOfYear(day);
				const end = endOfYear(day);
				const object = {
					start,
					end,
					month: new Date(day).toDateString(),
					raw_date: new Date(day),
				};
				array2y.push(object);
				i2y -= 1;
			}
			return {
				format: "Last 2 Years",
				array: array2y,
			};
			break;

		default:
			var date2 = input ? new Date(input) : new Date();
			let i2d = 0,
				countd = 0;
			const array2d = [];
			const thisArrayd = [];
			var date2 = input ? new Date(input) : new Date();
			let monthStartd = startOfMonth(date2),
				monthEndd = endOfWeek(endOfMonth(date2)),
				gapd = Math.round(
					(monthEndd.getTime() - monthStartd.getTime()) / (1000 * 60 * 60 * 24)
				),
				dayd: Date = new Date();

			while (i2d < gapd) {
				if (countd < 1) {
					const start = monthStartd;
					const end = endOfWeek(monthStartd);
					dayd = new Date(monthStartd);
					const dateObject = {
						start,
						end,
						day: dayd.toDateString(),
						raw_date: new Date(dayd),
					};
					array2d.unshift(dateObject);
					thisArrayd.unshift(dateObject);
					i2d += 7;
					countd += 1;
					dayd = new Date(monthStartd.setDate(monthStartd.getDate() + i2d));
					monthStartd = startOfMonth(date2);
				} else if (endOfWeek(dayd) <= monthEndd) {
					const start = startOfWeek(dayd);
					const end = endOfWeek(dayd);
					const object = {
						start,
						end,
						day: new Date(dayd).toDateString(),
						raw_date: new Date(dayd),
					};
					array2d.push(object);
					i2d += 7;
					countd += 1;
				}
				monthStartd = startOfMonth(date2);
				dayd = new Date(monthStartd.setDate(monthStartd.getDate() + i2d));
				monthStartd = startOfMonth(date2);
			}

			array2d[0].start = monthStartd;
			return {
				format: "This Month",
				array: array2d,
			};
			break;
	}
};

export const backDaterForChartCustomDate = async (
	payload: any
): Promise<BackDaterResponse> => {
	const { start_date, end_date } = payload;
	let response: BackDaterResponse = {
		format: `from ${new Date(start_date).toDateString()} to ${new Date(end_date).toDateString()}`,
		array: [],
	};
	const ranges: backDaterArray[] = [];
	const start_date_obj = new Date(start_date);
	const end_date_obj = new Date(end_date);
	while (start_date_obj <= end_date_obj) {
		const start_of_day = startOfDay(start_date_obj);
		const end_of_day = endOfDay(start_date_obj);
		ranges.push({
			start: start_of_day,
			end: end_of_day,
			day: start_of_day.toDateString(),
			month: start_of_day.toDateString(),
			raw_date: start_date,
		});
		start_date_obj.setDate(start_date_obj.getDate() + 1);
	}
	response.array = ranges;
	return response;
};

export const getPercentageDifference = (number_1: number, number_2: number) => {
	try {
		let percentage_difference = 0;
		if (number_1 !== 0) {
			percentage_difference =
				Number(
					parseFloat(String(((number_1 - number_2) / number_1) * 100)).toFixed(
						2
					)
				) || 0;
		}

		const final = percentage_difference === null ? 0 : percentage_difference;
		return final;
	} catch (error) {
		console.log("🚀 ~ getPercentageChange ~ error:", error);
	}
};

export const backTrackToADate = (format: string) => {
	try {
		let back_date: Date = new Date();
		let today = new Date();
		switch (format) {
			case Timeline.TODAY:
				back_date = new Date(
					new Date(today).setDate(new Date(today).getDate() - 1)
				);
				break;
			case Timeline.YESTERDAY:
				back_date = new Date(
					new Date(today).setDate(new Date(today).getDate() - 2)
				);
				break;
			case Timeline.THIS_WEEK:
				back_date = new Date(
					new Date(today).setDate(new Date(today).getDate() - 7)
				);
				break;
			case Timeline.LAST_7_DAYS:
				back_date = new Date(
					new Date(today).setDate(new Date(today).getDate() - 7)
				);
				break;
			case Timeline.THIS_MONTH:
				back_date = new Date(
					new Date(today).setMonth(new Date(today).getMonth() - 1)
				);
				break;
			case Timeline.LAST_6_MONTHS:
				back_date = new Date(
					new Date(today).setMonth(new Date(today).getMonth() - 6)
				);
				break;
			case Timeline.LAST_12_MONTHS:
				back_date = new Date(
					new Date(today).setMonth(new Date(today).getMonth() - 12)
				);
				break;
			case Timeline.LAST_2_YEARS:
				back_date = new Date(
					new Date(today).setMonth(new Date(today).getMonth() - 24)
				);
				break;

			default:
				break;
		}
		return back_date;
	} catch (error) {
		console.log("🚀 ~ backTrackToADate ~ error:", error);
	}
};

export const nearest = function (num: number, near: number = 50) {
	const rounded = Math.ceil(num / near) * near;
	return rounded;
};

export const generateUnusedAdminId = async (
	role: InstanceType<typeof roleModel>
): Promise<string> => {
	let existingAdminWithCode: any;
	let finalUniqueCode: string;
	try {
		var adminCount = await adminModel.countDocuments({ Role: role._id });
		var rand = genAphaNumericCode(3);
		var uniqueId = `${role.alias.toUpperCase()}${rand.toUpperCase()}${adminCount}`;
		existingAdminWithCode = await adminModel.findOne({
			UniqueId: uniqueId,
		});
		finalUniqueCode = uniqueId;
		while (
			existingAdminWithCode !== null &&
			existingAdminWithCode !== undefined
		) {
			adminCount = await adminModel.countDocuments({ Role: role._id });
			rand = genAphaNumericCode(3);
			uniqueId = `${role.alias.toUpperCase()}${rand.toUpperCase()}${adminCount}`;
			existingAdminWithCode = await adminModel.findOne({
				UniqueId: uniqueId,
			});
			finalUniqueCode = uniqueId;
		}
		return finalUniqueCode;
	} catch (error: any) {
		console.log("🚀 ~ generateUnusedAdminId ~ error:", error);
		return error.toString();
	}
};

export const calculateDateXDaysAgo = (days: number): Date => {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date;
};
