import { ReadWriteDto } from "@/utils/interfaces/base.interface";
import mongoose, { Document, Types } from "mongoose";

export interface Admin extends Document {
	FirstName: string;
	LastName: string;
	Email: string;
	PhoneNumber?: string | null;
	ProfileImage?: string | null;
	Password: string;
	IsActive?: boolean | null;
	Role?: string | null;
	Token?: string | null;
}

export interface Role extends Document {
	name: string;
	admin: ReadWriteDto;
	config: ReadWriteDto;
	order: ReadWriteDto;
	buyer: ReadWriteDto;
	seller: ReadWriteDto;
	product: ReadWriteDto;
	transaction: ReadWriteDto;
	created_by?: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}
