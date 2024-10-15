import jwt from 'jsonwebtoken';
import Token from '../interfaces/token.interface';
import { User } from '@/resources/user/user.interface';
import * as bcrypt from 'bcrypt'
import otpModel from '@/resources/user/otp.model';
import { verificationCode } from '.';
import ResponseData from '../interfaces/responseData.interface';
import { HttpCodes } from '../constants/httpcode';
import { StatusMessages } from '../enums/base.enum';

export const createToken = (user: User): string => {
  const id = user._id || user.id
  return jwt.sign({ id: id }, process.env.JWT_SECRET as jwt.Secret, {
    expiresIn: "1y"
  });
}

export const verifyToken = (token: string): Promise<jwt.VerifyErrors | Token> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET as jwt.Secret, (err, payload) => {
      if (err) return reject(err);

      resolve(payload as Token);
    });
  })
}

export const hashPassword = async (password: string) => {
  try {
    let hashedPassword = bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(8)
    )
    return hashedPassword

  } catch (error: any) {
    console.log("🚀 ~ hashPassword ~ error:", error)
    return error.toString()
  }
}

export const comparePassword = async (
  input_password: string,
  stored_password: string
) => {
  try {
    const isCorrect = bcrypt.compareSync(input_password, stored_password)
    return isCorrect

  } catch (error: any) {
    console.log("🚀 ~ error:", error)
    return false
  }
}

export const generateOtpModel = async (
  purpose: string,
  user: User,
  email?: string,
) => {
  try {
    const unusedOtp = await otpModel.findOne({
      purpose,
      user: user?._id,
    })
    if (unusedOtp) {
      await otpModel.deleteOne({ _id: unusedOtp._id })
    }
    const otp = await generateUnusedOtp()
    const token = await createToken(user)
    const newOtp = await otpModel.create({
      otp,
      token,
      user: user._id,
      purpose,
      email: user?.Email || email,
      phone_number: user?.PhoneNumber
    })
    return newOtp
  } catch (error: any) {
    console.log("🚀 ~ error:", error)
    return error.toString()
  }
}

export const generateUnusedOtp = async (): Promise<string> => {
  try {
    const currentDate = new Date()
    const yesterday = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000)
    let otp: string
    let code = String(verificationCode())
    var existingOtp = await otpModel.findOne({
      otp: code
    })
    if ((existingOtp) && (existingOtp.createdAt < yesterday)) {
      await otpModel.deleteOne({
        otp: code
      })
    }

    while ((existingOtp !== null) && (existingOtp !== undefined)) {
      console.log("CODE EXISTS ALREADY::::", code);
      code = String(verificationCode())
      existingOtp = await otpModel.findOne({
        otp: code
      })
    }
    otp = code
    console.log("CODE IS NOT BEING USED BY ANYBODY:::", otp);
    deleteOldOtps(yesterday)
    return otp

  } catch (error: any) {
    console.log("🚀 ~ generateUnusedOtp ~ error:", error)
    return error.toString()
  }
}

export const deleteOldOtps = async (date: Date) => {
  try {
    await otpModel.deleteMany({
      createdAt: {
        $lt: date
      }
    })
  } catch (error) {
    console.log("🚀 ~ deleteOldOtps ~ error:", error)

  }
}

export const isOtpCorrect = async (otp: string, purpose: string): Promise<ResponseData> => {
  let responseData: ResponseData
  try {
    const existingOtp = await otpModel.findOne({
      otp,
      purpose
    })
    if (!existingOtp) {
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_BAD_REQUEST,
        message: "Invalid Otp",
      }
      return responseData
    } else {
      const data = {
        user_id: existingOtp?.user,
        email: existingOtp?.email
      }
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Otp Valid",
        data
      }
      await otpModel.deleteOne({
        _id: existingOtp._id
      })

      return responseData
    }

  } catch (error: any) {
    console.log("🚀 ~ validateOtp ~ error:", error)
    responseData = {
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: error.toString(),
    }
    return responseData
  }
}

