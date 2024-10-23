import { User, ShippingAddress } from "@/resources/user/user.interface";
import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import {
  comparePassword,
  createToken,
  generateOtpModel,
  isOtpCorrect
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
  AddProductDto,
  FetchProductsDto
} from "./product.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OtpPurposeOptions, StatusMessages, YesOrNo } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import productModel from "./product.model";
import categoryModel from "../category/category.model";
import cloudUploader from "@/utils/config/cloudUploader";
import { getPaginatedRecords } from "@/utils/helpers/paginate";

class ProductService {
  private user = UserModel;
  private product = productModel;
  private category = categoryModel

  public async addProduct(
    addProductDto: AddProductDto,
    user: InstanceType<typeof UserModel>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const productExists = await this.product.findOne({
        vendor: user?._id,
        product_name: String(addProductDto.product_name).toLowerCase()
      });

      if (productExists) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Product With This Name Already Exists",
        }
        return responseData
      }
      const category = await this.category.findById(addProductDto.category)
      if (!category) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Category Not Found",
        }
        return responseData
      }
      let image_urls = []
      if (addProductDto?.images && addProductDto?.images.length > 0) {
        for (const file of addProductDto?.images) {
          const url = await cloudUploader.imageUploader(file)
          image_urls.push(url)
        }
      }
      const newProduct = await this.product.create({
        product_name: String(addProductDto.product_name),
        description: addProductDto?.description,
        category: category?._id,
        vendor: user?._id,
        unit_price: Number(addProductDto?.unit_price),
        product_quantity: Number(addProductDto.product_quantity),
        ...(addProductDto?.discount_price && (addProductDto?.discount_price > 0) && {
          is_discounted: true
        }),
        ...(addProductDto?.discount_price && (addProductDto?.discount_price > 0) && {
          discount_price: Number(addProductDto?.discount_price)
        }),
        in_stock: addProductDto.in_stock === YesOrNo.YES ? true : false,
        ...((image_urls.length > 0) && {
          images: image_urls
        })
      })

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_CREATED,
        message: "Product Added Successfully",
        data: newProduct
      }
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }


  public async fetchProducts(
    payload: FetchProductsDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const search = {
        ...(payload?.filter?.product_name && {
          product_name: { $regex: payload?.filter?.product_name, $options: "i" }
        }),
        ...(payload?.filter?.category && {
          category: payload?.filter?.category
        }),
        ...((payload?.filter?.price_lower && payload?.filter?.price_upper) && {
          unit_price: {
            $gte: payload?.filter?.price_lower,
            $lte: payload?.filter?.price_upper
          }
        }),
      }

      var paginatedRecords = await getPaginatedRecords(
        this.product, {
        limit: payload?.limit,
        page: payload?.page,
        data: search,
        populateObj: {
          path: "category",
          select: "name"
        }
      }
      )

      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Products Fetched Successfully",
        data: paginatedRecords
      }
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

}

export default ProductService;