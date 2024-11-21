import {
	IdentificationTypes,
	SignupChannels,
	Timeline,
	UserTypes,
} from "@/utils/enums/base.enum";
import { backDaterArray } from "@/utils/interfaces/base.interface";
import userModel from "../user/user.model";
import orderDetailsModel from "../order/orderDetails.model";

export interface CreateAssignmentDto {
	buyer: InstanceType<typeof userModel>;
	order_details: InstanceType<typeof orderDetailsModel>[];
}
