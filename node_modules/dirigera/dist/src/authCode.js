"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCodeChallenge = exports.generateCodeVerifier = exports.CODE_CHALLENGE_METHOD = void 0;
const crypto_1 = __importDefault(require("crypto"));
const CODE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
const CODE_LENGTH = 128;
exports.CODE_CHALLENGE_METHOD = 'S256';
const generateCodeVerifier = () => {
    return [...Array(CODE_LENGTH)]
        .map(() => CODE_CHARACTERS[Math.floor(Math.random() * CODE_CHARACTERS.length)])
        .join('');
};
exports.generateCodeVerifier = generateCodeVerifier;
const calculateCodeChallenge = (codeVerifier) => {
    return crypto_1.default.createHash('sha256').update(codeVerifier).digest('base64url');
};
exports.calculateCodeChallenge = calculateCodeChallenge;
