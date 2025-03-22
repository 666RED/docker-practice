import Search from "../models/Search";
import logger from "../utils/logger";

export const searchPostController = async (req, res) => {
	logger.info(`Search post endpoint hit...`);
	try {
		const { query } = req.query;

		const results = await Search.find(
			{ $text: { $search: query } },
			{ score: { $meta: "textScore" } }
		)
			.sort({ score: { $meta: "textScore" } })
			.limit(10);

		res.status(200).json({ success: true, results });
	} catch (err) {
		logger.error(`Error while searching post`, err);
		res.status(500).json({
			success: false,
			message: `Error while searching post`,
		});
	}
};
