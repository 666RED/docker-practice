"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ioredis_1 = __importDefault(require("ioredis"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const logger_1 = __importDefault(require("./utils/logger"));
const express_http_proxy_1 = __importDefault(require("express-http-proxy"));
const errorHandler_1 = require("./middleware/errorHandler");
const authMiddleware_1 = require("./middleware/authMiddleware");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const redisClient = new ioredis_1.default(process.env.REDIS_URL);
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const myRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new rate_limit_redis_1.default({
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args) => redisClient.call(...args),
    }),
});
app.use(myRateLimit);
// log req info
app.use((req, res, next) => {
    logger_1.default.info(`Received ${req.method} request to ${req.url}`);
    logger_1.default.info(`Request body, ${req.body}`);
    next();
});
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger_1.default.error(`Proxy error: ${err.message}`);
        res
            .status(500)
            .json({ message: `Internal server error`, error: err.message });
    },
};
// setting up proxy for identity service
app.use("/v1/auth", (0, express_http_proxy_1.default)(process.env.IDENTITY_SERVICE_URL, Object.assign(Object.assign({}, proxyOptions), { proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        return proxyReqOpts;
    }, userResDecorator: (proxyRes, proxyResData, userRes) => {
        logger_1.default.info(`Response received from Identify Service: ${proxyRes.statusCode}`);
        return proxyResData;
    } })));
// setting up proxy for post service
app.use("/v1/posts", authMiddleware_1.validateToken, (0, express_http_proxy_1.default)(process.env.POST_SERVICE_URL, Object.assign(Object.assign({}, proxyOptions), { proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    }, userResDecorator: (proxyRes, proxyResData, userRes) => {
        logger_1.default.info(`Response received from Post Service: ${proxyRes.statusCode}`);
        return proxyResData;
    } })));
// setting up proxy for media service
app.use("/v1/media", authMiddleware_1.validateToken, (0, express_http_proxy_1.default)(process.env.MEDIA_SERVICE_URL, Object.assign(Object.assign({}, proxyOptions), { proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
            proxyReqOpts["Content-Type"] = "application/json";
        }
        return proxyReqOpts;
    }, userResDecorator: (proxyRes, proxyResData, userRes) => {
        logger_1.default.info(`Response received from Media Service: ${proxyRes.statusCode}`);
        return proxyResData;
    }, parseReqBody: false })));
// setting up proxy for search service
app.use("/v1/search", authMiddleware_1.validateToken, (0, express_http_proxy_1.default)(process.env.SEARCH_SERVICE_URL, Object.assign(Object.assign({}, proxyOptions), { proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    }, userResDecorator: (proxyRes, proxyResData, userRes) => {
        logger_1.default.info(`Response received from Search Service: ${proxyRes.statusCode}`);
        return proxyResData;
    } })));
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    logger_1.default.info(`API Gateway is running on port ${PORT}`);
    logger_1.default.info(`Identity Service is running on port ${process.env.IDENTITY_SERVICE_URL}`);
    logger_1.default.info(`Post Service is running on port ${process.env.POST_SERVICE_URL}`);
    logger_1.default.info(`Media Service is running on port ${process.env.MEDIA_SERVICE_URL}`);
    logger_1.default.info(`Search Service is running on port ${process.env.SEARCH_SERVICE_URL}`);
    logger_1.default.info(`Redis Url ${process.env.REDIS_URL}`);
});
