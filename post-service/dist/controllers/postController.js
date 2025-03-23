"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.getSinglePost = exports.getAllPosts = exports.createPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const logger_1 = __importDefault(require("../utils/logger"));
const validation_1 = require("../utils/validation");
const redisCache_1 = require("../utils/redisCache");
const rabbitmq_1 = require("../utils/rabbitmq");
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Create post endpoint hit...`);
    try {
        const { error } = (0, validation_1.validateCreatePost)(req.body);
        if (error) {
            logger_1.default.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new Post_1.default({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        });
        yield newlyCreatedPost.save();
        yield (0, rabbitmq_1.publishEvent)("post.created", {
            postId: newlyCreatedPost._id.toString(),
            userId: newlyCreatedPost.user.toString(),
            content: newlyCreatedPost.content,
            createdAt: newlyCreatedPost.createdAt,
        });
        yield (0, redisCache_1.invalidatePostCache)(req, newlyCreatedPost._id.toString());
        logger_1.default.info(`Post created successfully`);
        res.status(201).json({
            success: true,
            message: `Post created successfully`,
        });
    }
    catch (err) {
        logger_1.default.error(`Error creating post`, err);
        res.status(500).json({
            success: false,
            message: "Error creating post",
        });
    }
});
exports.createPost = createPost;
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Get all posts endpoint hit...`);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = yield req.redisClient.get(cacheKey);
        const totalPosts = yield Post_1.default.countDocuments();
        // if posts are cached
        if (cachedPosts) {
            const result = Object.assign(Object.assign({}, JSON.parse(cachedPosts)), { currentPage: page, totalPages: Math.ceil(totalPosts / limit), totalPosts });
            return res.status(200).json({
                success: true,
                result,
            });
        }
        const posts = yield Post_1.default.find({})
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);
        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
        };
        // save posts in redis cache (300: 5 minutes)
        yield req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
        res.status(200).json({
            success: true,
            result,
        });
    }
    catch (err) {
        logger_1.default.error(`Error fetching all posts`, err);
        res.status(500).json({
            success: false,
            message: "Error fetching all posts",
        });
    }
});
exports.getAllPosts = getAllPosts;
const getSinglePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Get single post endpoint hit...`);
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = yield req.redisClient.get(cacheKey);
        if (cachedPost) {
            return res
                .status(200)
                .json({ success: true, post: JSON.parse(cachedPost) });
        }
        const singlePost = yield Post_1.default.findById(postId);
        if (!singlePost) {
            return res
                .status(404)
                .json({ success: false, message: "Post not found" });
        }
        yield req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePost));
        res.status(200).json({ success: true, post: singlePost });
    }
    catch (err) {
        logger_1.default.error(`Error fetching single post`, err);
        res.status(500).json({
            success: false,
            message: "Error fetching single post",
        });
    }
});
exports.getSinglePost = getSinglePost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Delete post endpoint hit...`);
    try {
        const postId = req.params.id;
        const deletedPost = yield Post_1.default.findOneAndDelete({
            _id: postId,
            user: req.user.userId,
        });
        if (!deletedPost) {
            return res
                .status(404)
                .json({ success: false, message: "Post not found" });
        }
        // publish post delete method
        yield (0, rabbitmq_1.publishEvent)("post.deleted", {
            postId: deletedPost._id.toString(),
            userId: req.user.userId,
            mediaIds: deletedPost.mediaIds,
        });
        yield (0, redisCache_1.invalidatePostCache)(req, postId);
        res
            .status(200)
            .json({ success: true, message: "Post deleted successfully" });
    }
    catch (err) {
        logger_1.default.error(`Error fetching single post`, err);
        res.status(500).json({
            success: false,
            message: "Error fetching single post",
        });
    }
});
exports.deletePost = deletePost;
