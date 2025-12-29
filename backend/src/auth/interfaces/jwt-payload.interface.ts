/**
 * JWT payload interface
 * This is the structure of data stored in the JWT token
 */
export interface JwtPayload {
  /** Subject (employee ID) */
  sub: number;

  /** Employee username */
  username: string;

  /** Employee email */
  email: string;

  /** Employee role */
  role: string;

  /** Token issued at timestamp (added by JWT library) */
  iat?: number;

  /** Token expiration timestamp (added by JWT library) */
  exp?: number;
}
