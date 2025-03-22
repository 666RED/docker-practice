import { Request, Response } from "express";
import Post from "../models/Post";
import logger from "../utils/logger";
import { validateCreatePost } from "../utils/validation";
import { invalidatePostCache } from "../utils/redisCache";
import { publishEvent } from "../utils/rabbitmq";

export const createPost = async (req, res) => {
	logger.info(`Create post endpoint hit...`);
	try {
		const { error } = validateCreatePost(req.body);

		if (error) {
			logger.warn("Validation error", error.details[0].message);
			return res.status(400).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const { content, mediaIds } = req.body;

		const newlyCreatedPost = new Post({
			user: req.user.userId,
			content,
			mediaIds: mediaIds || [],
		});

		await newlyCreatedPost.save();

		await publishEvent("post.created", {
			postId: newlyCreatedPost._id.toString(),
			userId: newlyCreatedPost.user.toString(),
			content: newlyCreatedPost.content,
			createdAt: newlyCreatedPost.createdAt,
		});

		await invalidatePostCache(req, newlyCreatedPost._id.toString());

		logger.info(`Post created successfully`);
		res.status(201).json({
			success: true,
			message: `Post created successfully`,
		});
	} catch (err) {
		logger.error(`Error creating post`, err);
		res.status(500).json({
			success: false,
			message: "Error creating post",
		});
	}
};

export const getAllPosts = async (req, res) => {
	logger.info(`Get all posts endpoint hit...`);
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const startIndex = (page - 1) * limit;

		const cacheKey = `posts:${page}:${limit}`;
		const cachedPosts = await req.redisClient.get(cacheKey);
		const totalPosts = await Post.countDocuments();

		// if posts are cached
		if (cachedPosts) {
			const result = {
				...JSON.parse(cachedPosts),
				currentPage: page,
				totalPages: Math.ceil(totalPosts / limit),
				totalPosts,
			};
			return res.status(200).json({
				success: true,
				result,
			});
		}

		const posts = await Post.find({})
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
		await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

		res.status(200).json({
			success: true,
			result,
		});
	} catch (err) {
		logger.error(`Error fetching all posts`, err);
		res.status(500).json({
			success: false,
			message: "Error fetching all posts",
		});
	}
};

export const getSinglePost = async (req, res) => {
	logger.info(`Get single post endpoint hit...`);
	try {
		const postId = req.params.id;
		const cacheKey = `post:${postId}`;
		const cachedPost = await req.redisClient.get(cacheKey);

		if (cachedPost) {
			return res
				.status(200)
				.json({ success: true, post: JSON.parse(cachedPost) });
		}

		const singlePost = await Post.findById(postId);

		if (!singlePost) {
			return res
				.status(404)
				.json({ success: false, message: "Post not found" });
		}

		await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePost));

		res.status(200).json({ success: true, post: singlePost });
	} catch (err) {
		logger.error(`Error fetching single post`, err);
		res.status(500).json({
			success: false,
			message: "Error fetching single post",
		});
	}
};

export const deletePost = async (req, res) => {
	logger.info(`Delete post endpoint hit...`);
	try {
		const postId = req.params.id;

		const deletedPost = await Post.findOneAndDelete({
			_id: postId,
			user: req.user.userId,
		});

		if (!deletedPost) {
			return res
				.status(404)
				.json({ success: false, message: "Post not found" });
		}

		// publish post delete method
		await publishEvent("post.deleted", {
			postId: deletedPost._id.toString(),
			userId: req.user.userId,
			mediaIds: deletedPost.mediaIds,
		});

		await invalidatePostCache(req, postId);

		res
			.status(200)
			.json({ success: true, message: "Post deleted successfully" });
	} catch (err) {
		logger.error(`Error fetching single post`, err);
		res.status(500).json({
			success: false,
			message: "Error fetching single post",
		});
	}
};
