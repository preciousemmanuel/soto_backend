import {
  SignupChannels,
  UserTypes
} from "@/utils/enums/base.enum";

export interface CreateUserDto {
  FullName: string;
  Email: string;
  UserName?: string;
  IsActive?: boolean;
  Role?: string;
  PhoneNumber: string;
  fcmToken?: string;
  playerId?: string;
  Password: string;
  SignupChannel?: SignupChannels,
  UserType: UserTypes,
}

export interface AddShippingAddressDto {
  address: string;
}

export interface LoginDto {
  email_or_phone_number: string;
  password: string;
  userType: UserTypes
}



