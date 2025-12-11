"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationError = handleValidationError;
exports.validateRequest = validateRequest;
function handleValidationError(res, result) {
    const payload = {
        message: 'validation failed',
        errors: result.errors || [],
    };
    return res.status(400).json(payload);
}
function validateRequest(fn, source = 'body') {
    return (req, res, next) => {
        try {
            const data = source === 'body' ? req.body : req.query;
            const result = fn(data);
            if (!result.valid)
                return handleValidationError(res, result);
            // attach cleaned value if present
            if (result.value !== undefined) {
                if (source === 'body')
                    req.validatedBody = result.value;
                else
                    req.validatedQuery = result.value;
            }
            return next();
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: 'validation middleware error', error: String(err && err.message) });
        }
    };
}
