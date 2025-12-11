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
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
(async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) {
            console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
            process.exit(1);
        }
        // Ensure uuid generation function exists and users table exists
        // uuid_generate_v4() requires the uuid-ossp extension on Postgres
        await (0, db_1.query)(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email text UNIQUE,
        phone text,
        password_hash text,
        verified_at timestamptz,
        role text,
        created_at timestamptz DEFAULT now()
      );
    `);
        const hashed = await bcrypt_1.default.hash(password, 10);
        // Upsert admin by email
        const res = await (0, db_1.query)('SELECT * FROM users WHERE email=$1', [email]);
        if ((res?.rowCount ?? 0) > 0) {
            await (0, db_1.query)('UPDATE users SET password_hash=$1, role=$2, verified_at=now() WHERE email=$3', [
                hashed,
                'admin',
                email,
            ]);
            console.log('Admin user updated');
        }
        else {
            await (0, db_1.query)('INSERT INTO users (email, password_hash, role, verified_at) VALUES ($1,$2,$3,now())', [email, hashed, 'admin']);
            console.log('Admin user created');
        }
        await db_1.default.end();
        process.exit(0);
    }
    catch (err) {
        console.error('Seeding failed', err);
        try {
            await db_1.default.end();
        }
        catch (_) {
            // ignore
        }
        process.exit(1);
    }
})();
