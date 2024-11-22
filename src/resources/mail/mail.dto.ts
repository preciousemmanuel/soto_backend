import {
	IdentificationTypes,
	SignupChannels,
	UserTypes,
} from "@/utils/enums/base.enum";
import assignmentModel from "../assignment/assignment.model";

export interface CreateBusinessDto {
	business_name: string;
	email: string;
	last_name?: string;
	phone_number: string;
	adress: string;
	category?: string;
	description?: string;
	business_logo?: Express.Multer.File;
}

export interface UpdateBusinessDto extends Partial<CreateBusinessDto> {}

export interface VerificationDto {
	verification_type: IdentificationTypes;
	verification_number: string;
}

export interface AssignmentMailsDto {
	email: string;
	first_name: string;
	assignments: InstanceType<typeof assignmentModel>[];
}
