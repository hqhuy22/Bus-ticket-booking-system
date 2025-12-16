import { Router, Request, Response, NextFunction } from 'express';
import { DefaultBookingController, bookingValidate } from '../controllers/booking.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { validateGuestLookup } from '../validators/booking.validator';
import { authMiddleware, AuthenticatedRequest, optionalAuth } from '../middlewares/auth.middleware';
import BookingService from '../services/booking.service';
import TicketService from '../services/ticket.service';

const router = Router();

// Helper middleware: ensure authenticated user is booking owner or admin
async function requireBookingOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const bookingId = req.params.id as string;
  // If user is authenticated, keep previous behavior (owner or admin)
  if (req.user) {
    try {
      const booking = await BookingService.getBookingDetails(bookingId);
      if (!booking) return res.status(404).json({ message: 'not found' });
      if (booking.user_id && req.user.id === booking.user_id) return next();
      if (req.user.role === 'admin') return next();
      return res.status(403).json({ message: 'Not authorized' });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  }

  // For guests (no req.user), require booking reference and contact info to match
  try {
    // booking reference might be provided as header or param (param may be the ref already)
    const bookingRef = (req.headers['x-booking-reference'] as string) || req.params.id;
    const contactEmail =
      (req.headers['x-contact-email'] as string) ||
      (req.body && req.body.contactEmail) ||
      req.query.contactEmail;
    const contactPhone =
      (req.headers['x-contact-phone'] as string) ||
      (req.body && req.body.contactPhone) ||
      req.query.contactPhone;

    if (!bookingRef || (!contactEmail && !contactPhone))
      return res.status(401).json({ message: 'missing guest credentials' });

    const booking = (await BookingService.getBookingDetails(bookingRef).catch(
      () => undefined,
    )) as any;
    // If booking not found by id, try lookup by reference+contact
    let details = booking;
    if (!details) {
      details = await BookingService.getBookingDetails(bookingRef).catch(() => undefined);
    }

    // Use repository lookup by reference+contact for verification
    const found = await BookingService.getBookingDetails(bookingRef).catch(() => undefined);
    // Fallback to repository findByReferenceAndContact
    const candidate = await (
      await import('../repositories/booking.repository')
    ).default
      .findByReferenceAndContact(bookingRef, {
        email: contactEmail ?? null,
        phone: contactPhone ?? null,
      })
      .catch(() => undefined as any);

    if (!candidate) return res.status(403).json({ message: 'Not authorized' });
    // attach a lightweight user marker for downstream handlers (guest)
    req.user = { id: `guest:${candidate.id}`, email: candidate.contact_email ?? undefined } as any;
    return next();
  } catch (err: any) {
    const msg = err && err.message ? String(err.message) : 'internal error';
    if (msg.includes('not found')) return res.status(404).json({ message: msg });
    return res.status(400).json({ message: msg });
  }
}

// Initiate: allow guest checkout without authentication; validation still applies
router.post('/initiate', bookingValidate.initiate, (req: Request, res: Response) => {
  return DefaultBookingController.initiate(req, res);
});

// Lookup moved behind auth so only authenticated users can query bookings
// Guest lookup route removed - guests are not supported

// Guest lookup endpoint: POST /guest-lookup { bookingReference, contactEmail?, contactPhone? }
router.post(
  '/guest-lookup',
  validateRequest(validateGuestLookup, 'body'),
  (req: Request, res: Response) => {
    return DefaultBookingController.guestLookup(req, res);
  },
);

// Protected routes (require authentication)
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  return DefaultBookingController.myBookings(req as any, res);
});

router.post(
  '/:id/passengers',
  optionalAuth,
  requireBookingOwner,
  bookingValidate.passengers,
  (req: Request, res: Response) => DefaultBookingController.addPassengers(req, res),
);

router.post(
  '/:id/confirm',
  optionalAuth,
  requireBookingOwner,
  bookingValidate.confirm,
  (req: Request, res: Response) => DefaultBookingController.confirm(req, res),
);

router.post('/:id/cancel', optionalAuth, requireBookingOwner, (req: Request, res: Response) => {
  return DefaultBookingController.cancel(req as any, res);
});

router.get('/:id', authMiddleware, requireBookingOwner, (req: Request, res: Response) => {
  return DefaultBookingController.getBooking(req, res);
});

router.post(
  '/:id/refresh-lock',
  optionalAuth,
  bookingValidate.refreshLock,
  (req: Request, res: Response) => DefaultBookingController.refreshLock(req, res),
);

// Resend ticket (owner or admin)
router.post(
  '/:id/resend-ticket',
  authMiddleware,
  requireBookingOwner,
  async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.id as string;
      await TicketService.sendTicketEmail(bookingId);
      return res.json({ message: 'ticket resent' });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      if (msg.includes('not found')) return res.status(404).json({ message: msg });
      return res.status(400).json({ message: msg });
    }
  },
);

export default router;
