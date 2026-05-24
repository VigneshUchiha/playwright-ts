export const ROUTES = {
  LOGIN: '/',
  INVENTORY: '/inventory.html',
  CART: '/cart.html',
  CHECKOUT_INFO: '/checkout-step-one.html',
  CHECKOUT_OVERVIEW: '/checkout-step-two.html',
  CHECKOUT_COMPLETE: '/checkout-complete.html',
} as const;

export type RouteName = keyof typeof ROUTES;
