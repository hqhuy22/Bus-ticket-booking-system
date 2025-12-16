import { Request, Response } from 'express';
import BookingService from '../services/booking.service';
import BookingRepository from '../repositories/booking.repository';
import {
  validateInitiate,
  validatePassengers,
  validateConfirm,
  validateRefreshLock,
} from '../validators/booking.validator';
import { validateRequest } from '../middlewares/validation.middleware';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

class BookingController {
  // Initiate booking: create pending booking and lock seats. Returns booking with sessionId in response.
  async initiate(req: Request, res: Response) {
    try {
      const body = (req as any).validatedBody ?? req.body;
      const userId = (req as AuthenticatedRequest).user?.id ?? null;
      const { tripId, seatIds, contactEmail, contactPhone, sessionId } = body as any;

      const booking = await BookingService.createBooking(
        userId,
        tripId,
        seatIds,
        { email: contactEmail, phone: contactPhone },
        sessionId,
      );

      // return booking and sessionId so client can refresh locks
      return res.status(201).json({ booking, sessionId: sessionId ?? null });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // Add passenger details to a booking
  async addPassengers(req: Request, res: Response) {
    try {
      const bookingId = req.params.id as string;
      const body = (req as any).validatedBody ?? req.body;
      const passengers = body.passengers as any[];

      // Map camelCase fields from client (fullName, documentId, seatCode) to
      // snake_case expected by repository/service (full_name, document_id, seat_code).
      const mappedPassengers = (passengers || []).map((p: any) => ({
        full_name: p.fullName ?? p.full_name,
        document_id: p.documentId ?? p.document_id ?? null,
        seat_code: p.seatCode ?? p.seat_code,
        phone: p.phone ?? null,
      }));

      await BookingService.addPassengerDetails(bookingId, mappedPassengers);
      const updated = await BookingRepository.getBookingById(bookingId);
      return res.json({ booking: updated });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // Confirm booking
  async confirm(req: Request, res: Response) {
    try {
      const bookingId = req.params.id as string;
      const body = (req as any).validatedBody ?? req.body;
      const { paymentProvider, transactionRef, amount } = body as any;

      const paymentPayload =
        paymentProvider || transactionRef
          ? ({
              provider: paymentProvider as any,
              transaction_ref: transactionRef,
              amount: amount ?? 0,
            } as any)
          : undefined;
      const details = await BookingService.confirmBooking(bookingId, paymentPayload);
      return res.json(details);
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      if (msg.includes('expired')) return res.status(400).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // Get booking details. Require auth or valid session (session via query/sessionId header or booking.contact info)
  async getBooking(req: Request, res: Response) {
    try {
      const bookingId = req.params.id as string;
      if (!bookingId) return res.status(400).json({ message: 'missing id' });
      // Allow guests to lookup by booking_reference + contact info passed in headers or query
      // If the requester is authenticated and is owner/admin, return details
      try {
        const details = await BookingService.getBookingDetails(bookingId);
        return res.json(details);
      } catch (e) {
        // Not found by id — try to lookup by booking_reference + contact info from query/body/headers
      }

      const ref = bookingId;
      const contactEmail =
        (req.query.contactEmail as string) ||
        req.headers['x-contact-email'] ||
        (req.body && req.body.contactEmail);
      const contactPhone =
        (req.query.contactPhone as string) ||
        req.headers['x-contact-phone'] ||
        (req.body && req.body.contactPhone);
      if (!contactEmail && !contactPhone) return res.status(404).json({ message: 'not found' });

      const details = await BookingRepository.findByReferenceAndContact(ref, {
        email: contactEmail as string | undefined,
        phone: contactPhone as string | undefined,
      });
      if (!details) return res.status(404).json({ message: 'not found' });
      return res.json(details);
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // Allow guests to lookup booking by reference + contact via POST body (safer than query)
  async guestLookup(req: Request, res: Response) {
    try {
      const body = (req as any).validatedBody ?? req.body;
      const { bookingReference, contactEmail, contactPhone } = body as any;
      if (!bookingReference) return res.status(400).json({ message: 'missing bookingReference' });
      if (!contactEmail && !contactPhone)
        return res.status(400).json({ message: 'missing contact info' });

      const details = await BookingRepository.findByReferenceAndContact(bookingReference, {
        email: contactEmail ?? null,
        phone: contactPhone ?? null,
      });
      if (!details) return res.status(404).json({ message: 'not found' });
      return res.json(details);
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // Get current user's booking history (requires auth)
  async myBookings(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'unauthenticated' });
      const userId = req.user.id;
      const status = (req.query.status as string) || undefined;
      const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10) || 1) : 1;
      const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10) || 25) : 25;
      const offset = (page - 1) * limit;

      const result = await BookingService.getUserBookingHistory(userId, { status, limit, offset });
      return res.json({ items: result.items, total: result.total, page, limit });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err && err.message ? String(err.message) : 'internal error' });
    }
  }

  // Cancel booking: require owner or admin
  async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const bookingId = req.params.id as string;
      if (!req.user) return res.status(401).json({ message: 'unauthenticated' });
      await BookingService.cancelBooking(bookingId, req.user.id);
      return res.json({ message: 'cancelled' });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      if (msg.includes('Not authorized')) return res.status(403).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // Guest lookup removed: only authenticated users can query bookings

  // Refresh seat lock
  async refreshLock(req: Request, res: Response) {
    try {
      const bookingId = req.params.id as string;
      const body = (req as any).validatedBody ?? req.body;
      const { seatIds, sessionId } = body as any;

      // need booking to find tripId
      const booking = await BookingRepository.getBookingById(bookingId);
      if (!booking) return res.status(404).json({ message: 'not found' });

      const ok = await BookingService.refreshLock(booking.trip_id, seatIds, sessionId);
      if (!ok) return res.status(400).json({ message: 'failed to refresh lock' });
      return res.json({ message: 'refreshed' });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err && err.message ? String(err.message) : 'internal error' });
    }
  }
}

export const DefaultBookingController = new BookingController();

// Export validators for route wiring
export const bookingValidate = {
  initiate: validateRequest(validateInitiate, 'body'),
  passengers: validateRequest(validatePassengers, 'body'),
  confirm: validateRequest(validateConfirm, 'body'),
  refreshLock: validateRequest(validateRefreshLock, 'body'),
};
