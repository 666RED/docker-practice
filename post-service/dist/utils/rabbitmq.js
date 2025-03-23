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
exports.connectToRabbitMQ = connectToRabbitMQ;
exports.publishEvent = publishEvent;
const amqplib_1 = __importDefault(require("amqplib"));
const logger_1 = __importDefault(require("./logger"));
let connection = null;
let channel = null;
const EXCHANGE_NAME = "facebook_events";
function connectToRabbitMQ() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            connection = yield amqplib_1.default.connect(process.env.RABBITMQ_URL);
            channel = yield connection.createChannel();
            yield channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
            logger_1.default.info(`Connected to RabbitMQ`);
            return channel;
        }
        catch (err) {
            logger_1.default.error(`Error connecting to RabbitMQ`, err);
        }
    });
}
function publishEvent(routingKey, message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!channel) {
            yield connectToRabbitMQ();
        }
        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
        logger_1.default.info(`Event published: ${routingKey}`);
    });
}
