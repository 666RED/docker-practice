"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    // later need to modify
    mediaIds: [{ type: String }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
postSchema.index({ content: "text" });
exports.default = mongoose_1.default.model("Post", postSchema);
