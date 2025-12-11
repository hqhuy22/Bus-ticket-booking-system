"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScheduleTripInput = validateScheduleTripInput;
exports.validateSearchInput = validateSearchInput;
exports.validateSeatConfigInput = validateSeatConfigInput;
exports.validateScheduleQuery = validateScheduleQuery;
const isISODate = (s) => {
    if (!s)
        return false;
    const d = new Date(String(s));
    return !Number.isNaN(d.getTime());
};
function validateScheduleTripInput(data) {
    const errors = [];
    const value = {};
    if (data == null || typeof data !== 'object') {
        return {
            valid: false,
            errors: [{ field: 'body', message: 'body must be an object' }],
        };
    }
    const { route_id, bus_id, departure_time, arrival_time, base_price } = data;
    if (!route_id)
        errors.push({ field: 'route_id', message: 'route_id is required' });
    else
        value.route_id = route_id;
    if (!bus_id)
        errors.push({ field: 'bus_id', message: 'bus_id is required' });
    else
        value.bus_id = bus_id;
    if (!departure_time)
        errors.push({ field: 'departure_time', message: 'departure_time is required' });
    else if (!isISODate(departure_time))
        errors.push({ field: 'departure_time', message: 'departure_time must be a valid ISO date' });
    else
        value.departure_time = new Date(String(departure_time)).toISOString();
    if (!arrival_time)
        errors.push({ field: 'arrival_time', message: 'arrival_time is required' });
    else if (!isISODate(arrival_time))
        errors.push({ field: 'arrival_time', message: 'arrival_time must be a valid ISO date' });
    else
        value.arrival_time = new Date(String(arrival_time)).toISOString();
    if (departure_time && arrival_time && isISODate(departure_time) && isISODate(arrival_time)) {
        if (new Date(String(departure_time)).getTime() >= new Date(String(arrival_time)).getTime()) {
            errors.push({ field: 'arrival_time', message: 'arrival_time must be after departure_time' });
        }
    }
    if (base_price === undefined || base_price === null)
        errors.push({ field: 'base_price', message: 'base_price is required' });
    else if (Number.isNaN(Number(base_price)) || Number(base_price) < 0)
        errors.push({ field: 'base_price', message: 'base_price must be a non-negative number' });
    else
        value.base_price = Number(base_price);
    return {
        valid: errors.length === 0,
        errors: errors.length ? errors : undefined,
        value: errors.length ? undefined : value,
    };
}
function validateSearchInput(query) {
    const errors = [];
    const value = {};
    if (query == null)
        query = {};
    if (query.origin !== undefined) {
        if (typeof query.origin !== 'string' || query.origin.trim() === '')
            errors.push({ field: 'origin', message: 'origin must be a non-empty string' });
        else
            value.origin = String(query.origin).trim();
    }
    if (query.destination !== undefined) {
        if (typeof query.destination !== 'string' || query.destination.trim() === '')
            errors.push({ field: 'destination', message: 'destination must be a non-empty string' });
        else
            value.destination = String(query.destination).trim();
    }
    if (query.date !== undefined) {
        if (!isISODate(query.date))
            errors.push({ field: 'date', message: 'date must be an ISO date' });
        else
            value.date = new Date(String(query.date)).toISOString();
    }
    if (query.minPrice !== undefined) {
        if (Number.isNaN(Number(query.minPrice)) || Number(query.minPrice) < 0)
            errors.push({ field: 'minPrice', message: 'minPrice must be a non-negative number' });
        else
            value.minPrice = Number(query.minPrice);
    }
    if (query.maxPrice !== undefined) {
        if (Number.isNaN(Number(query.maxPrice)) || Number(query.maxPrice) < 0)
            errors.push({ field: 'maxPrice', message: 'maxPrice must be a non-negative number' });
        else
            value.maxPrice = Number(query.maxPrice);
    }
    if (value.minPrice !== undefined &&
        value.maxPrice !== undefined &&
        value.minPrice > value.maxPrice)
        errors.push({ field: 'priceRange', message: 'minPrice cannot be greater than maxPrice' });
    if (query.page !== undefined) {
        const p = parseInt(String(query.page), 10);
        if (Number.isNaN(p) || p < 1)
            errors.push({ field: 'page', message: 'page must be an integer >= 1' });
        else
            value.page = p;
    }
    if (query.limit !== undefined) {
        const l = parseInt(String(query.limit), 10);
        if (Number.isNaN(l) || l < 1)
            errors.push({ field: 'limit', message: 'limit must be an integer >= 1' });
        else
            value.limit = l;
    }
    if (query.departureStart !== undefined)
        value.departureStart = String(query.departureStart);
    if (query.departureEnd !== undefined)
        value.departureEnd = String(query.departureEnd);
    if (query.busType !== undefined)
        value.busType = String(query.busType);
    if (query.amenities !== undefined)
        value.amenities = query.amenities;
    return {
        valid: errors.length === 0,
        errors: errors.length ? errors : undefined,
        value: errors.length ? undefined : value,
    };
}
function validateSeatConfigInput(data) {
    const errors = [];
    const value = {};
    if (data == null || typeof data !== 'object') {
        return {
            valid: false,
            errors: [{ field: 'body', message: 'body must be an object' }],
        };
    }
    const { seat_code, row_number, column_number, seat_type, price_modifier, is_active } = data;
    if (!seat_code || typeof seat_code !== 'string' || seat_code.trim() === '')
        errors.push({
            field: 'seat_code',
            message: 'seat_code is required and must be a non-empty string',
        });
    else
        value.seat_code = String(seat_code).trim();
    if (row_number !== undefined) {
        const r = parseInt(String(row_number), 10);
        if (Number.isNaN(r) || r < 0)
            errors.push({ field: 'row_number', message: 'row_number must be a non-negative integer' });
        else
            value.row_number = r;
    }
    if (column_number !== undefined) {
        const c = parseInt(String(column_number), 10);
        if (Number.isNaN(c) || c < 0)
            errors.push({
                field: 'column_number',
                message: 'column_number must be a non-negative integer',
            });
        else
            value.column_number = c;
    }
    if (!seat_type || typeof seat_type !== 'string')
        errors.push({ field: 'seat_type', message: 'seat_type is required' });
    else
        value.seat_type = String(seat_type);
    if (price_modifier !== undefined) {
        if (Number.isNaN(Number(price_modifier)))
            errors.push({ field: 'price_modifier', message: 'price_modifier must be a number' });
        else
            value.price_modifier = Number(price_modifier);
    }
    if (is_active !== undefined)
        value.is_active = Boolean(is_active);
    return {
        valid: errors.length === 0,
        errors: errors.length ? errors : undefined,
        value: errors.length ? undefined : value,
    };
}
function validateScheduleQuery(query) {
    const errors = [];
    const value = {};
    if (!query || !query.start)
        errors.push({ field: 'start', message: 'start query param is required (ISO date)' });
    else if (!isISODate(query.start))
        errors.push({ field: 'start', message: 'start must be an ISO date' });
    else
        value.start = new Date(String(query.start)).toISOString();
    if (!query || !query.end)
        errors.push({ field: 'end', message: 'end query param is required (ISO date)' });
    else if (!isISODate(query.end))
        errors.push({ field: 'end', message: 'end must be an ISO date' });
    else
        value.end = new Date(String(query.end)).toISOString();
    if (query.limit !== undefined) {
        const l = parseInt(String(query.limit), 10);
        if (Number.isNaN(l) || l < 1)
            errors.push({ field: 'limit', message: 'limit must be an integer >= 1' });
        else
            value.limit = l;
    }
    if (query.offset !== undefined) {
        const o = parseInt(String(query.offset), 10);
        if (Number.isNaN(o) || o < 0)
            errors.push({ field: 'offset', message: 'offset must be an integer >= 0' });
        else
            value.offset = o;
    }
    return {
        valid: errors.length === 0,
        errors: errors.length ? errors : undefined,
        value: errors.length ? undefined : value,
    };
}
