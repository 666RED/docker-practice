import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import Redis from "ioredis";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq";
import searchRoutes from "./routes/searchRoutes";
import {
	handlePostCreated,
	handlePostDeletion,
} from "./eventHandlers.ts/searchEventHandlers";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		logger.info(`Connected to MongoDB`);
	})
	.catch((err) => {
		logger.error(`MongoDB connection error`, err);
	});

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

app.use("/api/search", searchRoutes);
app.use(errorHandler);

async function startServer() {
	try {
		await connectToRabbitMQ();

		await consumeEvent("post.created", handlePostCreated);
		await consumeEvent("post.deleted", handlePostDeletion);

		app.listen(PORT, () => {
			logger.info(`Server is now running on port ${PORT}`);
		});
	} catch (err) {
		logger.error(`Failed to start search service`, err);
		process.exit(1);
	}
}

startServer();

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
