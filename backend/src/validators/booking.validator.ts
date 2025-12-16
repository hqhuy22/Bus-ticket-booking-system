import Joi from 'joi';
import { ValidationResult } from '../types/validation';

const PHONE_REGEX = /^\+?\d{7,15}$/;

function toValidationResult(schema: Joi.Schema, data: any): ValidationResult {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    return {
      valid: false,
      errors: error.details.map((d: any) => ({
        field: Array.isArray(d.path) ? d.path.join('.') : String(d.path),
        message: d.message,
      })),
    };
  }
  return { valid: true, value };
}

// 1. initiateBookingSchema
const initiateSchema = Joi.object({
  tripId: Joi.string().uuid().required(),
  seatIds: Joi.array().items(Joi.string().uuid()).min(1).max(5).required(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().pattern(PHONE_REGEX).optional(),
  sessionId: Joi.string().optional(),
});

// 2. addPassengersSchema
const passengersSchema = Joi.object({
  passengers: Joi.array()
    .items(
      Joi.object({
        fullName: Joi.string().min(2).max(100).required(),
        documentId: Joi.string().max(20).optional(),
        seatCode: Joi.string().required(),
        phone: Joi.string().pattern(PHONE_REGEX).optional(),
      }),
    )
    .min(1)
    .required(),
});

// 3. confirmBookingSchema
const confirmSchema = Joi.object({
  paymentProvider: Joi.string().valid('cash', 'bank_transfer', 'momo', 'vnpay').optional(),
  transactionRef: Joi.string().optional(),
  amount: Joi.number().optional(),
});

// guest lookup removed

// 5. refreshLockSchema
const refreshLockSchema = Joi.object({
  sessionId: Joi.string().required(),
  seatIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
});

export function validateInitiate(data: any): ValidationResult {
  return toValidationResult(initiateSchema, data);
}

export function validatePassengers(data: any): ValidationResult {
  return toValidationResult(passengersSchema, data);
}

export function validateConfirm(data: any): ValidationResult {
  return toValidationResult(confirmSchema, data);
}

// guest lookup removed

export function validateRefreshLock(data: any): ValidationResult {
  return toValidationResult(refreshLockSchema, data);
}

const guestLookupSchema = Joi.object({
  bookingReference: Joi.string().required(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().pattern(PHONE_REGEX).optional(),
});

export function validateGuestLookup(data: any): ValidationResult {
  return toValidationResult(guestLookupSchema, data);
}
