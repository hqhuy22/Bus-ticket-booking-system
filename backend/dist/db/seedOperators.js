"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importStar(require("../config/db"));
dotenv_1.default.config();
(async () => {
    try {
        await (0, db_1.query)(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS operators (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        contact_email text,
        contact_phone text,
        status text,
        approved_at timestamptz
      );
    `);
        const res = await (0, db_1.query)('SELECT * FROM operators LIMIT 1');
        if ((res?.rowCount ?? 0) === 0) {
            await (0, db_1.query)('INSERT INTO operators (name, contact_email, contact_phone, status, approved_at) VALUES ($1,$2,$3,$4,now())', ['Demo Operator', 'ops@example.com', '+10000000000', 'active']);
            console.log('Operator seeded');
        }
        else {
            console.log('Operator already present');
        }
        await db_1.default.end();
        process.exit(0);
    }
    catch (err) {
        console.error('seedOperators failed', err);
        try {
            await db_1.default.end();
        }
        catch (_) {
            // Intentionally ignored
        }
        process.exit(1);
    }
})();
