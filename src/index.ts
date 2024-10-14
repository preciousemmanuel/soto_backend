// import "dotenv/config";
import dotenv from 'dotenv';
import "module-alias/register";
import validateEnv from '@/utils/helpers/validateEnv';
import App from "./app";
import UserController from "@/resources/user/user.controller";

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

const app = new App([
    new UserController(),


    // new TransactionController(),
], Number(process.env.PORT));

app.listen();