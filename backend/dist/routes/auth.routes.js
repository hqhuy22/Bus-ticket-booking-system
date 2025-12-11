"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.default.register);
router.post('/login', auth_controller_1.default.login);
router.post('/forgot-password', auth_controller_1.default.forgotPassword);
router.post('/reset-password', auth_controller_1.default.resetPassword);
router.post('/refresh', auth_controller_1.default.refresh);
router.post('/logout', auth_controller_1.default.logout);
router.get('/verify', auth_controller_1.default.verify);
router.post('/resend', auth_controller_1.default.resend);
router.get('/status', auth_controller_1.default.status);
// Google OAuth endpoints
router.get('/google', auth_controller_1.default.googleRedirect);
router.get('/google/callback', auth_controller_1.default.googleCallback);
exports.default = router;
