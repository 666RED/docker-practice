"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postController_1 = require("../controllers/postController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.default)();
router.use(authMiddleware_1.authenticateRequest);
router.post("/create-post", postController_1.createPost);
router.get("/all-posts", postController_1.getAllPosts);
router.get("/:id", postController_1.getSinglePost);
router.delete("/delete-post/:id", postController_1.deletePost);
exports.default = router;
