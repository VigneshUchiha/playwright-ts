import type { ApiClient } from '@/utils/apiClient';
import type { HealthService, AuthService, BookingsService } from '@/services/api';
import type {
  LoginPage,
  InventoryPage,
  CartPage,
  CheckoutInfoPage,
  CheckoutOverviewPage,
  CheckoutCompletePage,
} from '@/pages/web';

export interface ApiFixtures {
  apiClient: ApiClient;
  healthApi: HealthService;
  authApi: AuthService;
  bookingsApi: BookingsService;
}

export interface PageFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
}
