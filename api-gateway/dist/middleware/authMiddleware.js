"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        logger_1.default.warn(`Access attempted without valid token`);
        return res.status(401).json({
            success: false,
            message: `Authentication required`,
        });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger_1.default.warn(`Invalid token`);
            return res.status(429).json({
                success: false,
                message: `Invalid token`,
            });
        }
        req.user = user;
        next();
    });
};
exports.validateToken = validateToken;
