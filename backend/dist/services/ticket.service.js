"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = __importDefault(require("./booking.service"));
const email_service_1 = __importDefault(require("./email.service"));
const qrcode_1 = __importDefault(require("qrcode"));
class TicketService {
    static async generateQRCode(data) {
        try {
            // returns a base64 data URL (e.g. "data:image/png;base64,...")
            return await qrcode_1.default.toDataURL(data, { margin: 1, width: 200 });
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            throw new Error(`Failed to generate QR code: ${e.message}`);
        }
    }
    static async getTicketData(bookingId) {
        const b = await booking_service_1.default.getBookingDetails(bookingId);
        if (!b)
            throw new Error('Booking not found');
        const passengers = (b.passengers || []).map((p) => ({
            full_name: p.full_name,
            seat_code: p.seat_code,
        }));
        const seats = (b.passengers || []).map((p) => p.seat_code);
        const trip = b.trip_info;
        // Format price and dates
        const total_amount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(Number(b.total_amount || 0));
        const booked_at = b.booked_at ? new Date(b.booked_at).toLocaleString() : undefined;
        const route_stops = [];
        if (trip && trip.route_info) {
            // best-effort: if route has origin/destination only
            route_stops.push(trip.route_info.origin);
            route_stops.push(trip.route_info.destination);
        }
        return {
            reference: b.booking_reference,
            passengers,
            origin: trip?.route_info?.origin,
            destination: trip?.route_info?.destination,
            departure_time: trip?.departure_time,
            arrival_time: trip?.arrival_time,
            bus_plate: trip?.bus_info?.plate_number,
            seats,
            total_amount,
            booked_at,
            route_stops,
        };
    }
    static async generateTicketHTML(booking) {
        // Prepare data
        const data = await TicketService.getTicketData(booking.id);
        // generate QR code as data URL using booking reference
        const qrData = await TicketService.generateQRCode(data.reference);
        // simple responsive / print-friendly HTML
        const passengerRows = data.passengers
            .map((p) => `<tr><td>${escapeHtml(p.full_name)}</td><td>${escapeHtml(p.seat_code)}</td></tr>`)
            .join('');
        const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>e-Ticket ${escapeHtml(data.reference)}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #222 }
          .container { max-width: 800px; margin: 16px auto; padding: 20px }
          .header { display:flex; align-items:center; justify-content:space-between }
          .brand { display:flex; align-items:center }
          .logo { width:80px; height:80px; background:#eee; display:inline-block; margin-right:12px }
          .ref { font-size:22px; font-weight:700; color:#0b69ff }
          .section { margin-top:16px; padding:12px; border-radius:8px; border:1px solid #e6e6e6 }
          table { width:100%; border-collapse:collapse }
          td, th { padding:8px; border-bottom:1px solid #f0f0f0 }
          .qr { text-align:center }
          .footer { font-size:11px; color:#666; margin-top:20px }
          @media print { .container { box-shadow:none; border:none } .header .logo { display:none } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">
              <div class="logo"><img src="/public/logo.png" alt="logo" style="max-width:100%;max-height:100%"/></div>
              <div>
                <div style="font-size:18px;font-weight:700">YourBus Co.</div>
                <div style="font-size:12px;color:#666">Comfortable & safe travel</div>
              </div>
            </div>
            <div class="ref">Reference: ${escapeHtml(data.reference)}</div>
          </div>

          <div class="section">
            <h3>Trip</h3>
            <table>
              <tr><td>From</td><td>${escapeHtml(data.origin || '-')}</td></tr>
              <tr><td>To</td><td>${escapeHtml(data.destination || '-')}</td></tr>
              <tr><td>Departure</td><td>${escapeHtml(data.departure_time || '-')}</td></tr>
              <tr><td>Arrival</td><td>${escapeHtml(data.arrival_time || '-')}</td></tr>
              <tr><td>Bus</td><td>${escapeHtml(data.bus_plate || '-')}</td></tr>
              <tr><td>Seats</td><td>${escapeHtml((data.seats || []).join(', ') || '-')}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>Passengers</h3>
            <table>
              <thead><tr><th>Name</th><th>Seat</th></tr></thead>
              <tbody>${passengerRows}</tbody>
            </table>
          </div>

          <div class="section">
            <h3>Payment</h3>
            <table>
              <tr><td>Total paid</td><td>${escapeHtml(data.total_amount)}</td></tr>
              <tr><td>Booked at</td><td>${escapeHtml(data.booked_at || '-')}</td></tr>
            </table>
          </div>

          <div class="section qr">
            <img src="${qrData}" alt="qr" style="width:160px;height:160px" />
            <div style="margin-top:8px;font-size:12px;color:#444">Show this QR at boarding</div>
          </div>

          <div class="footer">
            <strong>Terms & Conditions</strong>
            <p>Tickets are non-refundable except as stated in our policy. Please bring a valid ID. Boarding opens 15 minutes before departure.</p>
          </div>
        </div>
      </body>
    </html>
    `;
        return html;
    }
    static async sendTicketEmail(bookingId) {
        try {
            const booking = await booking_service_1.default.getBookingDetails(bookingId);
            if (!booking)
                throw new Error('Booking not found');
            const html = await TicketService.generateTicketHTML(booking);
            const emailService = new email_service_1.default();
            const recipient = booking.contact_email || '';
            if (!recipient)
                throw new Error('No contact email for booking');
            const subject = `Your Bus Ticket - ${booking.booking_reference}`;
            // Send email (no PDF attachment implementation for now - optional)
            await emailService.sendMail({ to: recipient, subject, html });
        }
        catch (err) {
            // bubble up with context
            const e = err instanceof Error ? err : new Error(String(err));
            throw new Error(`Failed to send ticket email: ${e.message}`);
        }
    }
}
exports.default = TicketService;
function escapeHtml(input) {
    if (!input)
        return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
