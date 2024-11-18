import {
  IdentificationTypes,
  SignupChannels,
  TransactionNarration,
  UserTypes
} from "@/utils/enums/base.enum";
import userModel from "../user/user.model";


export interface GeneratePaymentLinkDto {
  amount: number;
  card_id?: string;
  narration_id?: string;
  narration: TransactionNarration;
  save_card?: boolean
}

export interface AddCardDto {
  user_id: string;
  amount?: number;
  currency?: string;
  ref?: string;
  type?: string;
  authorization?: any;
  credit_or_debit_action?: boolean

}

export interface FullPaymentLinkDto extends GeneratePaymentLinkDto {
  user: InstanceType<typeof userModel>;
  txnRef?: string
  authorization_code?: string | null
  is_tokenized?: boolean
}

export interface VerificationDto {
  verification_type: IdentificationTypes
  verification_number: string
}

export interface GetTransactionsDto {
  user: InstanceType<typeof userModel>;
  limit: number;
  page: number;
  narration?: TransactionNarration | string;
}

export interface CreateTransactionLogDto {
  user: string;
  amount: number;
  narration: string;
  narration_id: string;
  ref: string;
  type?: string

}



