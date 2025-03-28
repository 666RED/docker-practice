import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import logger from "./utils/logger";
import proxy from "express-http-proxy";
import { errorHandler } from "./middleware/errorHandler";
import { validateToken } from "./middleware/authMiddleware";

dotenv.config();

const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const myRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100,
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

app.use(myRateLimit);

// log req info
app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	logger.info(`Request body, ${req.body}`);
	next();
});

const proxyOptions: proxy.ProxyOptions = {
	proxyReqPathResolver: (req) => {
		return req.originalUrl.replace(/^\/v1/, "/api");
	},
	proxyErrorHandler: (err, res, next) => {
		logger.error(`Proxy error: ${err.message}`);
		res
			.status(500)
			.json({ message: `Internal server error`, error: err.message });
	},
};

// setting up proxy for identity service
app.use(
	"/v1/auth",
	proxy(process.env.IDENTITY_SERVICE_URL, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (proxyRes, proxyResData, userRes) => {
			logger.info(
				`Response received from Identify Service: ${proxyRes.statusCode}`
			);

			return proxyResData;
		},
	})
);

// setting up proxy for post service
app.use(
	"/v1/posts",
	validateToken,
	proxy(process.env.POST_SERVICE_URL, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json";
			proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
			return proxyReqOpts;
		},
		userResDecorator: (proxyRes, proxyResData, userRes) => {
			logger.info(
				`Response received from Post Service: ${proxyRes.statusCode}`
			);

			return proxyResData;
		},
	})
);

// setting up proxy for media service
app.use(
	"/v1/media",
	validateToken,
	proxy(process.env.MEDIA_SERVICE_URL, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
			if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
				proxyReqOpts["Content-Type"] = "application/json";
			}

			return proxyReqOpts;
		},
		userResDecorator: (proxyRes, proxyResData, userRes) => {
			logger.info(
				`Response received from Media Service: ${proxyRes.statusCode}`
			);

			return proxyResData;
		},
		parseReqBody: false,
	})
);

// setting up proxy for search service
app.use(
	"/v1/search",
	validateToken,
	proxy(process.env.SEARCH_SERVICE_URL, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json";
			proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
			return proxyReqOpts;
		},
		userResDecorator: (proxyRes, proxyResData, userRes) => {
			logger.info(
				`Response received from Search Service: ${proxyRes.statusCode}`
			);

			return proxyResData;
		},
	})
);

app.use(errorHandler);

app.listen(PORT, () => {
	logger.info(`API Gateway is running on port ${PORT}`);
	logger.info(
		`Identity Service is running on port ${process.env.IDENTITY_SERVICE_URL}`
	);
	logger.info(
		`Post Service is running on port ${process.env.POST_SERVICE_URL}`
	);
	logger.info(
		`Media Service is running on port ${process.env.MEDIA_SERVICE_URL}`
	);
	logger.info(
		`Search Service is running on port ${process.env.SEARCH_SERVICE_URL}`
	);
	logger.info(`Redis Url ${process.env.REDIS_URL}`);
});
