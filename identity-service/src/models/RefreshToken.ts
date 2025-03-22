import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
	{
		token: {
			type: String,
			required: true,
			unique: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto deletion after a certain period

export default mongoose.model("RefreshToken", refreshTokenSchema);
