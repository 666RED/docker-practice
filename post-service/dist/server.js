"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const postRoutes_1 = __importDefault(require("../src/routes/postRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
const rabbitmq_1 = require("./utils/rabbitmq");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    logger_1.default.info(`Connected to MongoDB`);
})
    .catch((err) => {
    logger_1.default.error(`MongoDB connection error`, err);
});
const redisClient = new ioredis_1.default(process.env.REDIS_URL);
// middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// log request info (method & url & body)
app.use((req, res, next) => {
    logger_1.default.info(`Received ${req.method} request to ${req.url}`);
    logger_1.default.info(`Request body, ${req.body}`);
    next();
});
// routes -> pass redis client to routes
app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes_1.default);
app.use(errorHandler_1.errorHandler);
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, rabbitmq_1.connectToRabbitMQ)();
            app.listen(PORT, () => {
                logger_1.default.info(`Post service running on port ${PORT}`);
            });
        }
        catch (err) {
            logger_1.default.error(`Failed to connect to server`, err);
            process.exit(1);
        }
    });
}
startServer();
// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger_1.default.error("Unhandled Rejection at", promise, "reason:", reason);
});
