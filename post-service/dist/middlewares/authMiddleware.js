"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const authenticateRequest = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
        logger_1.default.warn(`Access attempted without user Id`);
        return res.status(401).json({
            success: false,
            message: `Authentication required! Please login to continue`,
        });
    }
    req.user = { userId };
    next();
};
exports.authenticateRequest = authenticateRequest;
