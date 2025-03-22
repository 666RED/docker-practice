import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import postRoutes from "../src/routes/postRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";
import { connectToRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3002;

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		logger.info(`Connected to MongoDB`);
	})
	.catch((err) => {
		logger.error(`MongoDB connection error`, err);
	});

const redisClient = new Redis(process.env.REDIS_URL);

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

// routes -> pass redis client to routes
app.use(
	"/api/posts",
	(req, res, next) => {
		req.redisClient = redisClient;
		next();
	},
	postRoutes
);

app.use(errorHandler);

async function startServer() {
	try {
		await connectToRabbitMQ();
		app.listen(PORT, () => {
			logger.info(`Post service running on port ${PORT}`);
		});
	} catch (err) {
		logger.error(`Failed to connect to server`, err);
		process.exit(1);
	}
}

startServer();

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
