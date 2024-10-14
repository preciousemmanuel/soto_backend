interface CreateUser {
  userId: number,
  FirstName: string;
  LastName: string;
  Email: string;
  UserName?: string;
  IsActive: boolean;
  Role: string;
  PhoneNumber: string;
  fcmToken?: string;
  playerId?: string;
}

export { CreateUser }