import mongoose, { Document } from "mongoose";

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
