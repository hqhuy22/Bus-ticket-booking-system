import { Router, Request, Response } from 'express';
import { DefaultTripController } from '../controllers/trip.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { validateSearchInput } from '../validators/trip.validator';

const router = Router();

// Public trip endpoints
router.get(
  '/search',
  validateRequest(validateSearchInput, 'query'),
  (req: Request, res: Response) => {
    return DefaultTripController.searchTrips(req, res);
  },
);

// use :id in the path per spec but the controller expects tripId param -> map it
router.get('/:id', (req: Request, res: Response) => {
  (req.params as any).tripId = (req.params as any).id;
  return DefaultTripController.getTripDetails(req, res);
});

// Return seat statuses (used by frontend polling every few seconds)
router.get('/:id/seats', (req: Request, res: Response) => {
  (req.params as any).tripId = (req.params as any).id;
  return DefaultTripController.getSeatStatuses(req, res);
});

router.get('/cities', (req: Request, res: Response) => {
  return DefaultTripController.getCitiesList(req, res);
});

router.get('/popular-routes', (req: Request, res: Response) => {
  return DefaultTripController.getPopularRoutes(req, res);
});

export default router;
