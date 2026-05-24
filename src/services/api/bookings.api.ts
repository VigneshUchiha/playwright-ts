import * as fs from 'fs';
import * as path from 'path';
import { expect } from '@playwright/test';
import { BaseApiService } from './base.api';
import { ApiClient, TypedResponse } from '@/utils/apiClient';
import { SchemaValidator } from '@/utils/schemaValidator';
import { API_ROUTES } from '@config/api-routes.config';

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export interface BookingIdResponse {
  bookingid: number;
  booking: Booking;
}

const SCHEMAS_DIR = path.resolve(__dirname, '../../../test-data/schemas');

function loadSchema(name: string): object {
  return JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, `${name}.schema.json`), 'utf8'));
}

export class BookingsService extends BaseApiService {
  private readonly validator: SchemaValidator;

  constructor(apiClient: ApiClient) {
    super(apiClient);
    this.validator = new SchemaValidator();
    this.validator.register('booking', loadSchema('booking'));
    // booking-id references booking via $ref — register an inlined version to avoid AJV ref resolution issues.
    const bookingIdInlined = {
      ...loadSchema('booking-id'),
      properties: {
        bookingid: { type: 'integer', minimum: 1 },
        booking: loadSchema('booking'),
      },
    };
    this.validator.register('booking-id', bookingIdInlined);
    this.validator.register('booking-list', loadSchema('booking-list'));
  }

  async listBookings(): Promise<TypedResponse<Array<{ bookingid: number }>>> {
    return this.step('list bookings', async () =>
      this.apiClient.get<Array<{ bookingid: number }>>(API_ROUTES.BOOKINGS),
    );
  }

  async getBooking(id: number): Promise<TypedResponse<Booking>> {
    return this.step(`get booking ${id}`, async () =>
      this.apiClient.get<Booking>(API_ROUTES.BOOKING_BY_ID(id)),
    );
  }

  async createBooking(payload: Booking): Promise<TypedResponse<BookingIdResponse>> {
    return this.step('create booking', async () =>
      this.apiClient.post<BookingIdResponse>(API_ROUTES.BOOKINGS, payload),
    );
  }

  async updateBooking(
    id: number,
    payload: Booking,
    token: string,
  ): Promise<TypedResponse<Booking>> {
    return this.step(`update booking ${id}`, async () =>
      this.apiClient.withToken(token).put<Booking>(API_ROUTES.BOOKING_BY_ID(id), payload),
    );
  }

  async deleteBooking(id: number, token: string): Promise<TypedResponse<void>> {
    return this.step(`delete booking ${id}`, async () =>
      this.apiClient.withToken(token).delete(API_ROUTES.BOOKING_BY_ID(id)),
    );
  }

  async verifyBookingId(response: TypedResponse<BookingIdResponse>): Promise<void> {
    await this.step('verify booking-id response', async () => {
      await this.verifyStatus(response, 200);
      this.validator.validate('booking-id', response.body);
      expect(response.body.bookingid, 'bookingid present').toBeGreaterThan(0);
    });
  }

  async verifyBookingMatches(actual: Booking, expected: Booking): Promise<void> {
    await this.step('verify booking payload matches expected', async () => {
      this.validator.validate('booking', actual);
      expect(actual.firstname).toBe(expected.firstname);
      expect(actual.lastname).toBe(expected.lastname);
      expect(actual.totalprice).toBe(expected.totalprice);
      expect(actual.depositpaid).toBe(expected.depositpaid);
      expect(actual.bookingdates.checkin).toBe(expected.bookingdates.checkin);
      expect(actual.bookingdates.checkout).toBe(expected.bookingdates.checkout);
    });
  }

  async verifyBookingListSchema(
    response: TypedResponse<Array<{ bookingid: number }>>,
  ): Promise<void> {
    await this.step('verify list schema', async () => {
      await this.verifyStatus(response, 200);
      this.validator.validate('booking-list', response.body);
    });
  }

  async verifyBookingIdInList(
    response: TypedResponse<Array<{ bookingid: number }>>,
    expectedId: number,
  ): Promise<void> {
    await this.step(`verify booking id ${expectedId} present in list`, async () => {
      await this.verifyStatus(response, 200);
      const ids = response.body.map((b) => b.bookingid);
      expect(ids, `Expected booking id ${expectedId} in list`).toContain(expectedId);
    });
  }

  async verifyDeleted<T>(response: TypedResponse<T>): Promise<void> {
    await this.step('verify delete success', async () => {
      // Restful-Booker returns 201 "Created" for DELETE per their docs (quirky but documented)
      expect([201, 204]).toContain(response.status);
    });
  }
}
