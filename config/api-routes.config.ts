export const API_ROUTES = {
  AUTH: '/auth',
  PING: '/ping',
  BOOKINGS: '/booking',
  BOOKING_BY_ID: (id: number | string): string => `/booking/${id}`,
} as const;

export type ApiRouteName = keyof typeof API_ROUTES;
