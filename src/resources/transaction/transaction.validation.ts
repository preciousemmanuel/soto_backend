import { IdentificationTypes, SignupChannels, TransactionNarration, UserTypes, YesOrNo } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';



const generatePaymentLinkSchema = Joi.object({
  amount: Joi.number().positive().required(),
  card_id: Joi.string().optional(),
  narration_id: Joi.string().required(),
  narration: Joi.string().valid(
    TransactionNarration.ORDER,
    TransactionNarration.PAYOUT,
    TransactionNarration.REFUND,
    TransactionNarration.WITHDRAWAL,
  ).required(),
  save_card: Joi.string().valid(
   YesOrNo.NO, YesOrNo.YES
  ).default(YesOrNo.NO).optional(),

});

const verifyBusinessSchema = Joi.object({
  verification_type: Joi.string().valid(
    IdentificationTypes.BVN,
    IdentificationTypes.NIN,
    IdentificationTypes.DRIVERS_LICENSE,
    IdentificationTypes.INTERNATIONAL_PASSPORT,
    IdentificationTypes.VOTERS_CARD,
  ).required(),
  verification_number: Joi.string().required(),

});



export default {
  generatePaymentLinkSchema,
  verifyBusinessSchema
}