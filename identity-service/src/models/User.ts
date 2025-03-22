import mongoose from "mongoose";
import argon2 from "argon2";

interface IUser extends Document {
	username: string;
	email: string;
	password: string;
	createdAt: Date;
	comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

userSchema.pre("save", async function (next) {
	if (this.isModified("password")) {
		try {
			this.password = await argon2.hash(this.password);
		} catch (err) {
			return next(err);
		}
	}
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	try {
		return await argon2.verify(this.password, candidatePassword);
	} catch (err) {
		throw err;
	}
};

userSchema.index({ username: "text" });

export default mongoose.model("User", userSchema);
