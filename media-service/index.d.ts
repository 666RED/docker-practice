import Redis from "ioredis";
import mongoose from "mongoose";

declare global {
	namespace Express {
		interface Request {
			user: { userId: mongoose.Schema.Types.ObjectId };
			redisClient: Redis;
		}
	}
}
