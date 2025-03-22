import Media from "../models/Media";
import { deleteMediaFromCloudinary } from "../utils/cloudinary";
import logger from "../utils/logger";

export const handlePostDeleted = async (event) => {
	const { postId, mediaIds } = event;

	try {
		const mediasToDelete = await Media.find({ _id: { $in: mediaIds } });
		for (const media of mediasToDelete) {
			await deleteMediaFromCloudinary(media.publicId);
			await Media.findByIdAndDelete(media._id);

			logger.info(
				`Deleted media ${media._id} associated with the deleted post ${postId}`
			);
		}

		logger.info(`Processed deletion of media for postId ${postId}`);
	} catch (err) {
		logger.error(`Error occurred when deleting the media`, err);
	}
};
