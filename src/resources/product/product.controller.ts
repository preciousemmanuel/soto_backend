import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./product.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { AddProductDto, FetchProductsDto, } from "./product.dto";
import ProductService from "./product.service";
import upload from "@/utils/config/multer";


class ProductController implements Controller {
  public path = "/product";
  public router = Router();
  private productService = new ProductService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/add-new`,
      authenticatedMiddleware,
      upload.array('images'),
      validationMiddleware(validate.addProductSchema),
      this.addProduct
    )

    this.router.get(
      `${this.path}/fetch`,
      validationMiddleware(validate.fetchProductSchema),
      this.fetchProducts
    )
  }

  private addProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const body: AddProductDto = req.body
      const user = req.user
      if (req.files) {
        body.images = req.files as Express.Multer.File[]
      }
      console.log("🚀 ~ ProductController ~ body:", body)

      const {
        status,
        code,
        message,
        data
      } = await this.productService.addProduct(body, user);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }


  private fetchProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const payload: FetchProductsDto = {
        limit: Number(req?.query?.limit),
        page: Number(req?.query?.page),
        filter: {
          ...(req?.query?.product_name && { product_name: String(req?.query?.product_name) }),
          ...(req?.query?.category && { category: String(req?.query?.category) }),
          ...(req?.query?.price_upper && { price_upper: Number(req?.query?.price_upper) }),
          ...(req?.query?.price_lower && { price_lower: Number(req?.query?.price_lower) }),
        }
      }


      const {
        status,
        code,
        message,
        data
      } = await this.productService.fetchProducts(payload);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }


}

export default ProductController;