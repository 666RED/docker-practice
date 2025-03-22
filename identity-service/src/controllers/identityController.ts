import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";
import logger from "../utils/logger";
import { validateLogin, validateRegistration } from "../utils/validation";

// user registration
export const registerUser = async (req, res) => {
	logger.info("Registration endpoint hit...");
	try {
		// validate the schema
		const { error } = validateRegistration(req.body);

		// required field(s) is missing
		if (error) {
			logger.warn("Validation error", error.details[0].message);
			return res.status(400).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const { email, username, password } = req.body;

		let user = await User.findOne({ $or: [{ email }, { username }] });

		// user already exists
		if (user) {
			logger.warn("User already exists");
			return res.status(400).json({
				success: false,
				message: "User already exists",
			});
		}

		user = new User({ username, email, password });
		await user.save();
		logger.warn("User saved successfully", user._id);

		const { accessToken, refreshToken } = await generateToken(user);

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			accessToken,
			refreshToken,
		});
	} catch (err) {
		logger.error("Registration error occurred", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// user login
export const loginUser = async (req, res) => {
	logger.info("Login endpoint hit...");
	try {
		const { error } = validateLogin(req.body);

		// validation error
		if (error) {
			logger.warn("Validation error", error.details[0].message);
			return res.status(400).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const { email, password } = req.body;

		const user = await User.findOne({ email });

		// invalid credentials
		if (!user) {
			logger.warn("Invalid user");
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// password validation
		const isValidPassword = await user.comparePassword(password);
		if (!isValidPassword) {
			logger.warn("Invalid password");
			return res.status(400).json({
				success: false,
				message: "Invalid password",
			});
		}

		const { accessToken, refreshToken } = await generateToken(user);

		res.status(200).json({
			accessToken,
			refreshToken,
			userId: user._id,
		});
	} catch (err) {
		logger.error("Login error occurred", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// refresh token
export const refreshUserToken = async (req, res) => {
	logger.info("Refresh Token endpoint hit...");
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			logger.warn(`Refresh token missing`);
			return res.status(400).json({
				success: false,
				message: "Refresh token missing",
			});
		}

		const storedToken = await RefreshToken.findOne({ token: refreshToken });

		// token not found OR expired
		if (!storedToken || storedToken.expiresAt < new Date()) {
			logger.warn(`Invalid or expired refresh token`);
			return res.status(401).json({
				success: false,
				message: `Invalid or expired refresh token`,
			});
		}

		const user = await User.findById(storedToken.user);

		if (!user) {
			logger.warn(`User not found`);
			return res.status(400).json({
				success: false,
				message: `User not found`,
			});
		}

		// generate new token
		const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
			await generateToken(user);

		// delete old refresh token
		await refreshToken.deleteOne({ _id: storedToken._id });

		res.status(200).json({
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		});
	} catch (err) {
		logger.error("Refresh token error occurred", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// logout
export const logoutUser = async (req, res) => {
	logger.info(`Logout endpoint hit...`);
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			logger.warn("Refresh token missing");
			return res.status(400).json({
				success: false,
				message: "Refresh token missing",
			});
		}

		await RefreshToken.deleteOne({ token: refreshToken });
		logger.info("Refresh token deleted for logout");

		res.status(200).json({
			success: true,
			message: "Logout successfully",
		});
	} catch (err) {
		logger.error("Logout error occurred", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
