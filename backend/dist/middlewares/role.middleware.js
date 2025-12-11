"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: 'unauthenticated' });
        if (req.user.role !== role)
            return res.status(403).json({ message: 'forbidden' });
        return next();
    };
}
