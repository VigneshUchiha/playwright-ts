import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';

test.describe('@regression @schema Restful-Booker /booking list schema', () => {
  test('TC_API_BOOK_SCHEMA_001: every entry has integer bookingid', async ({ bookingsApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Bookings',
      story: 'List response schema',
      severity: Severity.NORMAL,
      testId: 'TC_API_BOOK_SCHEMA_001',
      tags: ['@regression', '@schema'],
    });
    const response = await bookingsApi.listBookings();
    await bookingsApi.verifyBookingListSchema(response);
  });
});
