import express, { Application } from 'express';
import mongoose from "mongoose";
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import Controller from '@/utils/interfaces/controller.interface';
import ErrorMiddleware from './middleware/error.middleware';


import snsConnection from '@/utils/sns/sns';
import CategoryService from './resources/category/category.service';





class App {
    public express: Application;
    public port: number;
    public categoryService!: CategoryService

    constructor(
        controllers: Controller[],
        port: number,
        categoryService: CategoryService
    ) {
        this.express = express();
        this.port = port;
        this.categoryService = categoryService;
        this.initializeDB();
        this.initializeMiddleware();
        this.initializeControllers(controllers);

        this.initializeErrorHandling();
        this.connectSQSConsumers();
        this.connectQueueConsumers();
        this.connectSNSConsumers();
        this.initializeSeeders()

    }



    private initializeMiddleware(): void {
        this.express.use(helmet());
        this.express.use(cors());
        this.express.use(morgan("dev"));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(compression());

    }

    private initializeControllers(controllers: Controller[]): void {
        controllers.forEach((controller: Controller) => {
            this.express.use("/api", controller.router)
        })
    }

    private initializeErrorHandling(): void {
        this.express.use(ErrorMiddleware);
    }




    private initializeDB(): void {
        const { MONGO_URI } = process.env;

        mongoose.connect(`${MONGO_URI}`).then(() => {
            console.log('Connected to MongoDB');
        })
            .catch((error) => {
                console.error('Error connecting to MongoDB:', error);
            });
    }
    private connectQueueConsumers() {
        // mqConnection.consume(SEND_EMAIL,fnConsumerEmail);
    }

    private connectSQSConsumers() {


    }

    private connectSNSConsumers() {

        // snsConnection.createSnsConsumer("sns","arn:aws:sns:us-east-1:381491929354:CREATE_ACCOUNT",SQS_CREATE_ACCOUNT_ARN);
    }

    private initializeSeeders() {
        this.categoryService.seedCategories()
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            console.log(`server runing on port ${this.port}`)
        })
    }
}

export default App;