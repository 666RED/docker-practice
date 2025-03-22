import Search from "../models/Search";
import logger from "../utils/logger";

export async function handlePostCreated(event) {
	try {
		const { postId, userId, content, createdAt } = event;
		const newSearchPost = new Search({
			postId,
			userId,
			content,
			createdAt,
		});

		await newSearchPost.save();
		logger.info(
			`Search post created: ${postId}, ${newSearchPost._id.toString()}`
		);
	} catch (err) {
		logger.error(`Error handling post creation event`, err);
	}
}

export async function handlePostDeletion(event) {
	try {
		const { postId } = event;
		await Search.findOneAndDelete({ postId });

		logger.info(`Search post deleted successfully`);
	} catch (err) {
		logger.error(`Error handling post deletion event`, err);
	}
}
