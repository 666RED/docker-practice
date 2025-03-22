import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		// later need to modify
		mediaIds: [{ type: String }],
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

postSchema.index({ content: "text" });

export default mongoose.model("Post", postSchema);
