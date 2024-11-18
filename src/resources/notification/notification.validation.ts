import { YesOrNo, UserTypes, ReadAndUnread } from '@/utils/enums/base.enum';
import { email } from 'envalid';
import Joi from 'joi';


const addFcmTokenOrPlayerIdSchema = Joi.object({
  fcmToken: Joi.string().optional(),
  playerId: Joi.string().optional(),
  user_id: Joi.string().required(),
 
});

const fetchNotificationsSchema = Joi.object({
  limit: Joi.number().positive().default(10).optional(),
  page: Joi.number().positive().default(1).optional(),
  search: Joi.string().allow(null).allow("").optional(),
  type: Joi.string().valid(
    ReadAndUnread.READ, 
    ReadAndUnread.UNREAD
  )
  .default(ReadAndUnread.UNREAD)
  .optional(),
});

const modelIdSchema = Joi.object({
  id: Joi.string().required(),
});

export default {
  addFcmTokenOrPlayerIdSchema,
  fetchNotificationsSchema,
  modelIdSchema,
}