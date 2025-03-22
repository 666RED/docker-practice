export async function invalidatePostCache(req, input) {
	// for single post
	const cachedKey = `post:${input}`;
	await req.redisClient.del(cachedKey);

	// for all posts
	const keys = await req.redisClient.keys("posts:*");
	if (keys.length > 0) {
		await req.redisClient.del(keys);
	}
}
