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
      CREATE TABLE IF NOT EXISTS routes (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
        origin text NOT NULL,
        destination text NOT NULL,
        distance_km integer,
        estimated_minutes integer
      );
    `);
        const has = await (0, db_1.query)('SELECT * FROM routes LIMIT 1');
        if ((has?.rowCount ?? 0) === 0) {
            const op = await (0, db_1.query)('SELECT id FROM operators LIMIT 1');
            const opId = op?.rows?.[0]?.id ?? null;
            await (0, db_1.query)('INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES ($1,$2,$3,$4,$5)', [
                opId,
                'City A',
                'City B',
                120,
                150,
            ]);
            console.log('Route seeded');
        }
        else {
            console.log('Route already present');
        }
        await db_1.default.end();
        process.exit(0);
    }
    catch (err) {
        console.error('seedRoutes failed', err);
        try {
            await db_1.default.end();
        }
        catch (_) { }
        process.exit(1);
    }
})();
