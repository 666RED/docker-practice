import express from "express";
import {
	createPost,
	deletePost,
	getAllPosts,
	getSinglePost,
} from "../controllers/postController";
import { authenticateRequest } from "../middlewares/authMiddleware";

const router = express();

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getSinglePost);
router.delete("/delete-post/:id", deletePost);

export default router;
