"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envalid_1 = require("envalid");
function validateEnv() {
    (0, envalid_1.cleanEnv)(process.env, {
        NODE_ENV: (0, envalid_1.str)({
            choices: ['dev', 'prod', 'local']
        }),
        MONGO_URI: (0, envalid_1.str)(),
        JWT_SECRET: (0, envalid_1.str)(),
        CLOUDWATCH_GROUP_NAME: (0, envalid_1.str)(),
        PORT: (0, envalid_1.port)({ default: 3001 })
    });
}
exports.default = validateEnv;
