import cloudinary from "cloudinary";
import logger from "./logger";
import dotenv from "dotenv";

dotenv.config();

const v2 = cloudinary.v2;

v2.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
});

export const uploadMediaToCloudinary = (file) => {
	return new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
		const uploadStream = v2.uploader.upload_stream(
			{
				resource_type: "auto",
			},
			(error, result) => {
				if (error) {
					logger.error(`Error while uploading media to Cloudinary`, error);
					reject(error);
				} else {
					resolve(result);
				}
			}
		);

		uploadStream.end(file.buffer);
	});
};

export const deleteMediaFromCloudinary = async (publicId: string) => {
	try {
		const result = await v2.uploader.destroy(publicId);
		logger.info(`Media deleted successfully from cloud storage`, publicId);
		return result;
	} catch (err) {
		logger.error(`Error deleting media from cloudinary`, err);
		throw err;
	}
};
