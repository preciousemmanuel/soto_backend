import { Document } from "mongoose";

export default interface User extends Document{
    // userId:number,
    FirstName:string;
    LastName:string;
    Email:string; 
    UserName?:string;
    IsActive:boolean;
    Role:string;
    Token:string;
    
    // PhoneNumber:string;
    // fcmToken?:string;
    // playerId?:string;
}