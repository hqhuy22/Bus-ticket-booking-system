"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInitiate = validateInitiate;
exports.validatePassengers = validatePassengers;
exports.validateConfirm = validateConfirm;
exports.validateRefreshLock = validateRefreshLock;
exports.validateGuestLookup = validateGuestLookup;
const joi_1 = __importDefault(require("joi"));
const PHONE_REGEX = /^\+?\d{7,15}$/;
function toValidationResult(schema, data) {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
        return {
            valid: false,
            errors: error.details.map((d) => ({
                field: Array.isArray(d.path) ? d.path.join('.') : String(d.path),
                message: d.message,
            })),
        };
    }
    return { valid: true, value };
}
// 1. initiateBookingSchema
const initiateSchema = joi_1.default.object({
    tripId: joi_1.default.string().uuid().required(),
    seatIds: joi_1.default.array().items(joi_1.default.string().uuid()).min(1).max(5).required(),
    contactEmail: joi_1.default.string().email().optional(),
    contactPhone: joi_1.default.string().pattern(PHONE_REGEX).optional(),
    sessionId: joi_1.default.string().optional(),
});
// 2. addPassengersSchema
const passengersSchema = joi_1.default.object({
    passengers: joi_1.default.array()
        .items(joi_1.default.object({
        fullName: joi_1.default.string().min(2).max(100).required(),
        documentId: joi_1.default.string().max(20).optional(),
        seatCode: joi_1.default.string().required(),
        phone: joi_1.default.string().pattern(PHONE_REGEX).optional(),
    }))
        .min(1)
        .required(),
});
// 3. confirmBookingSchema
const confirmSchema = joi_1.default.object({
    paymentProvider: joi_1.default.string().valid('cash', 'bank_transfer', 'momo', 'vnpay').optional(),
    transactionRef: joi_1.default.string().optional(),
    amount: joi_1.default.number().optional(),
});
// guest lookup removed
// 5. refreshLockSchema
const refreshLockSchema = joi_1.default.object({
    sessionId: joi_1.default.string().required(),
    seatIds: joi_1.default.array().items(joi_1.default.string().uuid()).min(1).optional(),
});
function validateInitiate(data) {
    return toValidationResult(initiateSchema, data);
}
function validatePassengers(data) {
    return toValidationResult(passengersSchema, data);
}
function validateConfirm(data) {
    return toValidationResult(confirmSchema, data);
}
// guest lookup removed
function validateRefreshLock(data) {
    return toValidationResult(refreshLockSchema, data);
}
const guestLookupSchema = joi_1.default.object({
    bookingReference: joi_1.default.string().required(),
    contactEmail: joi_1.default.string().email().optional(),
    contactPhone: joi_1.default.string().pattern(PHONE_REGEX).optional(),
});
function validateGuestLookup(data) {
    return toValidationResult(guestLookupSchema, data);
}
