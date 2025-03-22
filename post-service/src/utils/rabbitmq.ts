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

export async function publishEvent(routingKey: string, message) {
	if (!channel) {
		await connectToRabbitMQ();
	}

	channel.publish(
		EXCHANGE_NAME,
		routingKey,
		Buffer.from(JSON.stringify(message))
	);

	logger.info(`Event published: ${routingKey}`);
}
