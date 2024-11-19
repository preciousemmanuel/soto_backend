import adminModel from "@/resources/adminConfig/admin.model";
import { Admin } from "@/resources/adminOverview/adminOverview.interface";
import User from "@/resources/user/user.interface";
import userModel from "@/resources/user/user.model";

declare global {
	namespace Express {
		export interface Request {
			user: User;
			admin: InstanceType<typeof adminModel>;
		}
	}
}
