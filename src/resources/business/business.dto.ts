import {
  IdentificationTypes,
  SignupChannels,
  UserTypes
} from "@/utils/enums/base.enum";


export interface CreateBusinessDto {
  business_name: string;
  email: string;
  last_name: string;
  phone_number: string;
}

export interface VerificationDto {
  verification_type: IdentificationTypes
  verification_number: string
}





