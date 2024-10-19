import {
  IdentificationTypes,
} from "@/utils/enums/base.enum";
import { Document } from "mongoose";

export interface Business extends Document {
  business_name: string;
  last_name: string;
  email: string;
  verification_type: IdentificationTypes;
  verification_number: string;
  phone_number: string;

}
