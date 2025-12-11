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
      CREATE TABLE IF NOT EXISTS trips (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
        bus_id uuid REFERENCES buses(id) ON DELETE SET NULL,
        departure_time timestamptz,
        arrival_time timestamptz,
        base_price numeric(10,2),
        status text
      );
    `);
        const r = await (0, db_1.query)('SELECT id FROM routes LIMIT 1');
        const t = await (0, db_1.query)('SELECT id FROM buses LIMIT 1');
        const routeId = r?.rows?.[0]?.id ?? null;
        const busId = t?.rows?.[0]?.id ?? null;
        const has = await (0, db_1.query)('SELECT * FROM trips LIMIT 1');
        if ((has?.rowCount ?? 0) === 0) {
            // Use parameterized times: departure now, arrival +1 hour via PostgreSQL
            await (0, db_1.query)("INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, status) VALUES ($1,$2, now(), now() + interval '1 hour', $3, $4)", [
                routeId,
                busId,
                100.0,
                'scheduled',
            ]);
            console.log('Trip seeded');
        }
        else {
            console.log('Trip already present');
        }
        await db_1.default.end();
        process.exit(0);
    }
    catch (err) {
        console.error('seedTrips failed', err);
        try {
            await db_1.default.end();
        }
        catch (_) { }
        process.exit(1);
    }
})();
