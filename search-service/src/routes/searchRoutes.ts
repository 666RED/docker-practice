import express from "express";
import { authenticateRequest } from "../middlewares/authMiddleware";
import { searchPostController } from "../controllers/searchControllers";

const router = express.Router();

router.use(authenticateRequest);

router.get("/posts", searchPostController);

export default router;
