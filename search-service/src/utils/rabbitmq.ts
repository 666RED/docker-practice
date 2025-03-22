import amqp from "amqplib";
import logger from "./logger";

let connection: amqp.ChannelModel = null;
let channel: amqp.Channel = null;

const EXCHANGE_NAME = "facebook_events";

export async function connectToRabbitMQ() {
	try {
		connection = await amqp.connect(process.env.RABBITMQ_URL);
		channel = await connection.createChannel();

		await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
		logger.info(`Connected to RabbitMQ`);
		return channel;
	} catch (err) {
		logger.error(`Error connecting to RabbitMQ`, err);
	}
}

export async function consumeEvent(routingKey: string, callback) {
	if (!channel) {
		await connectToRabbitMQ();
	}

	const q = await channel.assertQueue("", { exclusive: true });
	await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

	channel.consume(q.queue, (message) => {
		if (message !== null) {
			const content = JSON.parse(message.content.toString());
			callback(content);
			channel.ack(message);
		}
	});

	logger.info(`Subscribed to event: ${routingKey}`);
}
