import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract current customer from request
 * Use this in controllers protected by CustomerJwtGuard
 * 
 * Usage:
 * @CurrentCustomer() customer: CustomerPayload
 * @CurrentCustomer('customerId') customerId: number
 */
export const CurrentCustomer = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const customer = request.customer;

    if (!customer) {
      return null;
    }

    return data ? customer[data] : customer;
  },
);

/**
 * Customer payload type attached to request by CustomerJwtGuard
 */
export interface CustomerPayload {
  customerId: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  customerType: string;
}
