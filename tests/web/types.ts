export interface WebUserRow {
  TC_ID: string;
  user: string;
  password: string;
  expectedError?: string;
}

export interface WebCheckoutRow {
  TC_ID: string;
  firstName: string;
  lastName: string;
  postalCode: string;
}
