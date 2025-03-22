import Media from "../models/Media";
import { uploadMediaToCloudinary } from "../utils/cloudinary";
import logger from "../utils/logger";

export const uploadMedia = async (req, res) => {
	logger.info(`Upload media endpoint hit...`);
	try {
		if (!req.file) {
			logger.error(`No file found`);
			return res.status(400).json({
				success: false,
				message: "No file found",
			});
		}

		const { originalname, mimetype, buffer } = req.file;
		const userId = req.user.userId;

		logger.info(`File details: name=${originalname}, type=${mimetype}`);
		logger.info(`Uploading to Cloudinary starting`);

		const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
		const { public_id: publicId, secure_url: secureUrl } =
			cloudinaryUploadResult;
		logger.info(`Cloudinary upload successfully. Public Id - ${publicId}`);

		const newlyCreatedMedia = new Media({
			publicId,
			originalName: originalname,
			mimeType: mimetype,
			url: secureUrl,
			userId: req.user.userId,
		});

		await newlyCreatedMedia.save();

		res.status(201).json({
			success: true,
			mediaId: newlyCreatedMedia._id,
			url: newlyCreatedMedia.url,
			message: "Media upload is successful",
		});
	} catch (err) {
		logger.error(`Error while uploading media`, err);
		res.status(500).json({
			success: false,
			message: "Error while uploading media",
		});
	}
};

export const getAllMedias = async (req, res) => {
	try {
		const results = await Media.find({});
		res.status(200).json({
			success: true,
			medias: results,
		});
	} catch (err) {
		logger.error(`Error fetching media`, err);
		res.status(500).json({
			success: false,
			message: "Error fetching media",
		});
	}
};
