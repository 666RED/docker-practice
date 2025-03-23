"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreatePost = void 0;
const joi_1 = __importDefault(require("joi"));
const validateCreatePost = (data) => {
    const schema = joi_1.default.object({
        content: joi_1.default.string().min(3).max(50000).required(),
        mediaIds: joi_1.default.array(),
    });
    return schema.validate(data);
};
exports.validateCreatePost = validateCreatePost;
