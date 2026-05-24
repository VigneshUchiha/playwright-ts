import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';
import { ENV } from '@config/env.config';
import type { Booking, AuthOkResponse } from '@/services/api';

test.describe('@regression @bookings Restful-Booker /booking CRUD', () => {
  let createdId: number | null = null;
  let token: string | null = null;

  test.afterEach(async ({ bookingsApi, authApi }) => {
    if (createdId !== null) {
      let t = token;
      if (!t) {
        const tokenResponse = await authApi.createToken({
          username: ENV.RB_USER,
          password: ENV.RB_PASSWORD,
        });
        t = (tokenResponse.body as AuthOkResponse).token;
      }
      const deleteResponse = await bookingsApi.deleteBooking(createdId, t);
      await bookingsApi.verifyDeleted(deleteResponse);
      createdId = null;
      token = null;
    }
  });

  test('TC_API_BOOK_001..004: create → list contains id → get matches → update → delete', async ({
    authApi,
    bookingsApi,
  }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Bookings',
      story: 'CRUD flow',
      severity: Severity.CRITICAL,
      testId: 'TC_API_BOOK_001',
      tags: ['@regression', '@bookings'],
    });

    const payload = testDataManager.getByTcId<Booking & { TC_ID: string }>(
      'api_bookings',
      'TC_API_BOOK_001',
    );
    const expected: Booking = {
      firstname: payload.firstname,
      lastname: payload.lastname,
      totalprice: payload.totalprice,
      depositpaid: payload.depositpaid,
      bookingdates: payload.bookingdates,
      additionalneeds: payload.additionalneeds,
    };

    // TC_API_BOOK_001 — Create
    const createResponse = await bookingsApi.createBooking(expected);
    await bookingsApi.verifyBookingId(createResponse);
    createdId = createResponse.body.bookingid;

    // TC_API_BOOK_002 — List contains new id
    const listResponse = await bookingsApi.listBookings();
    await bookingsApi.verifyBookingListSchema(listResponse);
    await bookingsApi.verifyBookingIdInList(listResponse, createdId);

    // TC_API_BOOK_003 — Get matches payload
    const getResponse = await bookingsApi.getBooking(createdId);
    await bookingsApi.verifyBookingMatches(getResponse.body, expected);

    // TC_API_BOOK_004 — Update via auth token
    const tokenResponse = await authApi.createToken({
      username: ENV.RB_USER,
      password: ENV.RB_PASSWORD,
    });
    token = (tokenResponse.body as AuthOkResponse).token;

    const updated: Booking = { ...expected, additionalneeds: 'Extra towels' };
    const updateResponse = await bookingsApi.updateBooking(createdId, updated, token);
    await bookingsApi.verifyBookingMatches(updateResponse.body, updated);

    // Delete handled by afterEach
  });
});
