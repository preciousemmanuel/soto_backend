import { StatusMessages } from "../enums/base.enum";
import { HttpCodesEnum } from "../enums/httpCodes.enum";

interface ResponseData extends Object {
  status: StatusMessages;
  code: HttpCodesEnum
  message: string
  data?: Object | any
}

export default ResponseData;