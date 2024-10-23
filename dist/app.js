"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
class App {
    constructor(controllers, port, categoryService) {
        this.express = (0, express_1.default)();
        this.port = port;
        this.categoryService = categoryService;
        this.initializeDB();
        this.initializeMiddleware();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
        this.connectSQSConsumers();
        this.connectQueueConsumers();
        this.connectSNSConsumers();
        this.initializeSeeders();
    }
    initializeMiddleware() {
        this.express.use((0, helmet_1.default)());
        this.express.use((0, cors_1.default)());
        this.express.use((0, morgan_1.default)("dev"));
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.urlencoded({ extended: false }));
        this.express.use((0, compression_1.default)());
    }
    initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.express.use("/api", controller.router);
        });
    }
    initializeErrorHandling() {
        this.express.use(error_middleware_1.default);
    }
    initializeDB() {
        const { MONGO_URI } = process.env;
        mongoose_1.default.connect(`${MONGO_URI}`).then(() => {
            console.log('Connected to MongoDB');
        })
            .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
        });
    }
    connectQueueConsumers() {
        // mqConnection.consume(SEND_EMAIL,fnConsumerEmail);
    }
    connectSQSConsumers() {
    }
    connectSNSConsumers() {
        // snsConnection.createSnsConsumer("sns","arn:aws:sns:us-east-1:381491929354:CREATE_ACCOUNT",SQS_CREATE_ACCOUNT_ARN);
    }
    initializeSeeders() {
        this.categoryService.seedCategories();
    }
    listen() {
        this.express.listen(this.port, () => {
            console.log(`server runing on port ${this.port}`);
        });
    }
}
exports.default = App;
