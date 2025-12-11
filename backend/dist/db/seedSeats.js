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
        await (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS seats (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
        seat_code text,
        seat_type text,
        is_active boolean DEFAULT true
      );
    `);
        const b = await (0, db_1.query)('SELECT id FROM buses LIMIT 1');
        const busId = b?.rows?.[0]?.id ?? null;
        if (busId) {
            const has = await (0, db_1.query)('SELECT * FROM seats WHERE bus_id=$1 LIMIT 1', [busId]);
            if ((has?.rowCount ?? 0) === 0) {
                const seats = ['1A', '1B', '1C', '1D'];
                for (const s of seats) {
                    await (0, db_1.query)('INSERT INTO seats (bus_id, seat_code, seat_type) VALUES ($1,$2,$3)', [busId, s, 'standard']);
                }
                console.log('Seats seeded');
            }
            else {
                console.log('Seats already present');
            }
        }
        else {
            console.log('No bus found, skipping seats');
        }
        await db_1.default.end();
        process.exit(0);
    }
    catch (err) {
        console.error('seedSeats failed', err);
        try {
            await db_1.default.end();
        }
        catch (_) { }
        process.exit(1);
    }
})();
