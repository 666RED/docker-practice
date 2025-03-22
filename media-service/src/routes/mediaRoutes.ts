import express from "express";
import multer from "multer";
import { getAllMedias, uploadMedia } from "../controllers/mediaController";
import { authenticateRequest } from "../middlewares/authMiddleware";
import logger from "../utils/logger";

const router = express.Router();

// configure multer for file upload
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
}).single("file");

router.post(
	"/upload",
	authenticateRequest,
	// check multer functionality
	(req, res, next) => {
		upload(req, res, function (err) {
			if (err instanceof multer.MulterError) {
				logger.error(`Multer error while uploading`, err);
				return res.status(400).json({
					success: false,
					message: "Multer error while uploading",
					error: err.message,
					stack: err.stack,
				});
			} else if (err) {
				logger.error(`Unknown error while uploading`, err);
				return res.status(500).json({
					success: false,
					message: "Unknown error while uploading",
					error: err.message,
					stack: err.stack,
				});
			}

			if (!req.file) {
				return res.status(400).json({
					success: false,
					message: "No file found",
				});
			}

			next();
		});
	},
	uploadMedia // upload to cloudinary
);

router.get("/get", authenticateRequest, getAllMedias);

export default router;
