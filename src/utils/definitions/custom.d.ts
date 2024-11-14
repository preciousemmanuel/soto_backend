import { Admin } from "@/resources/adminOverview/adminOverview.interface";
import User from "@/resources/user/user.interface";

declare global {
    namespace Express{
        export interface Request{
            user: User,
            admin: Admin
        }
    }
}