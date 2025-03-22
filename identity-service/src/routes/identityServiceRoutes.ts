import express from "express";
import {
	registerUser,
	loginUser,
	refreshUserToken,
	logoutUser,
} from "../controllers/identityController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshUserToken);
router.post("/logout", logoutUser);

export default router;
