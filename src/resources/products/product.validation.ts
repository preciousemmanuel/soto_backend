import Joi from 'joi';


const updateFcm = Joi.object({
  token: Joi.string().required(),
});


export default { updateFcm }