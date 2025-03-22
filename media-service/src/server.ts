import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mediaRoutes from "./routes/mediaRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq";
import { handlePostDeleted } from "./eventHandlers/mediaEventHandlers";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

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

app.use("/api/media", mediaRoutes);
app.use(errorHandler);

async function startServer() {
	try {
		await connectToRabbitMQ();

		// consume events
		await consumeEvent("post.deleted", handlePostDeleted);

		app.listen(PORT, () => {
			logger.info(`Media service running on port ${PORT}`);
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
