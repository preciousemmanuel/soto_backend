import {
	IdentificationTypes,
	SignupChannels,
	Timeline,
	UserTypes,
} from "@/utils/enums/base.enum";
import { backDaterArray } from "@/utils/interfaces/base.interface";
import userModel from "../user/user.model";
import orderDetailsModel from "../order/orderDetails.model";
import { User } from "../user/user.interface";

export interface OrderDetailsForAssignmentDto
	extends InstanceType<typeof orderDetailsModel> {
	vendor_details?: User;
}
export interface CreateAssignmentDto {
	buyer: InstanceType<typeof userModel>;
	order_details: OrderDetailsForAssignmentDto[];
}
