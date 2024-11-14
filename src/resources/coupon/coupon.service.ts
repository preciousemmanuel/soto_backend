// import logger from "@/utils/logger";
import {
  FetchCategoriesDto,
} from "./coupon.dto";
import { StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import { getPaginatedRecords } from "@/utils/helpers/paginate";
import categoryModel from "./coupon.model";
import { categorySeedData } from "@/utils/seeders/category.data";

class CouponService {
  private Category = categoryModel;

  public async fetchCategories(
    payload: FetchCategoriesDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {

      var paginatedRecords = await getPaginatedRecords(this.Category,
        {
          limit: payload.limit,
          page: payload.page,
          ...(payload?.search && { data: payload?.search }),
        }
      )

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Categories Fetched Successfully",
        data: paginatedRecords
      }


      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ BusinessService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async seedCategories(): Promise<any> {
    try {
      const categories = await this.Category.countDocuments()
      if (categories > 0) {
        console.log("🚀 ~ CategoryService ~ seedCategories ~ categories:", categories)
        return
      }

      const insertCats = await this.Category.insertMany(categorySeedData)
      console.log("🚀 ~ CategoryService ~ seedCategories ~ insertCats:", insertCats)

      return
    } catch (error: any) {
      console.log("🚀 ~ CategoryService ~ seedCategories ~ error:", error)
      return;
    }

  }

}

export default CouponService;