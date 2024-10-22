import { requestProp } from "@/resources/mail/mail.interface";
import ResponseData from "../interfaces/responseData.interface";
import axios, { AxiosRequestConfig, Method } from 'axios';
import { StatusMessages } from "../enums/base.enum";
import { HttpCodes } from "../constants/httpcode";

export const uniqueCode = (): number => {
  const code = Math.floor(1000 + Math.random() * 9000);
  return code;
};


export const processAxiosErrorFromCatch = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
    return
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Request:', error.request);
  } else {
    // Something happened in setting up the request that triggered an error
    console.error('Error:', error.message);
  }
}

export const isObjectEmpty = (obj: object) => {
  return Object.entries(obj).length === 0;
};

export const verificationCode = () => {
  const code = Math.floor(1000 + Math.random() * 9000);
  return code;
};

export const axiosRequestFunction = async ({
  url,
  method,
  params,
  body,
  headers
}: requestProp
): Promise<ResponseData> => {
  let responseData: ResponseData = {
    status: StatusMessages.success,
    code: HttpCodes.HTTP_OK,
    message: "",
    data: null
  }
  try {
    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      ...(body && { data: body }),
      ...(params && { params: params }),
      ...(headers && { headers: headers }),

    }

    await axios(config)
      .then((response) => {
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: response.statusText,
          data: response?.data
        }
      })
      .catch((e) => {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: e.toString(),
          data: null
        }
      })
    return responseData


  } catch (error: any) {
    console.log("🚀 ~ error:", error)
    responseData = {
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: error.toString(),
      data: null
    }
  }
  return responseData
}
