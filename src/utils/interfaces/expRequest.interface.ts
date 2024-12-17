import userModel from "@/resources/user/user.model";
import { Request } from "express";

export interface RequestExt extends Request {
	_user?: InstanceType<typeof userModel>;
}

export interface GoogleUser {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber?: string;
	picture?: string;
}
