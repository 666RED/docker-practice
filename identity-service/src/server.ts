import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "./utils/logger";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import routes from "./routes/identityServiceRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
dotenv.config();

// connect to db
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		logger.info("Connected to MongoDB");
	})
	.catch((err) => {
		logger.error("Mongo connection error", err);
	});

const redisClient = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT || 3001;

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// log request info (method & url & body)
app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	logger.info(`Request body, ${req.body}`);
	next();
});

// DDos protection & rate limiting
const rateLimiter = new RateLimiterRedis({
	storeClient: redisClient,
	keyPrefix: "middleware",
	// can make 10 request in 1 second
	points: 10,
	duration: 1,
});

app.use((req, res, next) => {
	rateLimiter
		.consume(req.ip)
		.then(() => next())
		.catch(() => {
			logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
			res.status(429).json({ success: false, message: "Too many requests" });
		});
});

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 50,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({ success: false, message: "Too many requests" });
	},
	store: new RedisStore({
		// @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
		sendCommand: (...args) => redisClient.call(...args),
	}),
});

// apply the sensitive endpoints limiter to routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

// Routes
app.use("/api/auth", routes);

// error handler
app.use(errorHandler);

app.listen(PORT, () => {
	logger.info(`Identity service running on port ${PORT}`);
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
