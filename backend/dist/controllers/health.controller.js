"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const health = (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
};
exports.default = { health };
