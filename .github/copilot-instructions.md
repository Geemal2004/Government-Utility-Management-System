# Government Utility Management System - Project Context

## Overview
Building a full-stack Government Utility Management System for managing water, electricity, and gas utilities including customer management, billing, meter reading, payments, work orders, inventory, and HR/payroll.

## Tech Stack
- **Backend:** NestJS + TypeScript + TypeORM
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database:** Microsoft SQL Server (existing schema with 60+ tables)
- **Authentication:** JWT with passport-jwt
- **API Documentation:** Swagger/OpenAPI

## Architecture
- Monorepo structure with separate backend and frontend
- RESTful API design
- Role-based access control (RBAC)
- Iterative and incremental development approach

## Development Phases (Incremental Model)
1. **Phase 1:** Foundation + Authentication (Employee login)
2. **Phase 2:** Customer Management
3. **Phase 3:** Service Connections
4. **Phase 4:** Meter & Readings
5. **Phase 5:** Billing System
6. **Phase 6:** Payments
7. **Phase 7:** Employee & HR
8. **Phase 8:** Work Orders & Maintenance
9. **Phase 9:** Inventory & Warehouse
10. **Phase 10:** Advanced Features (Generation, Solar, Fleet)
11. **Phase 11:** Reporting & Analytics
12. **Phase 12:** Testing & Deployment

## Code Standards
- Use TypeScript strict mode
- Follow NestJS best practices (modules, services, controllers, DTOs)
- Use class-validator for validation
- Use class-transformer for transformations
- Implement proper error handling
- Add JSDoc comments for complex logic
- Use async/await for async operations
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling (utility-first)
- Implement proper loading and error states

## Database
- **Existing SQL Server schema** with 60+ tables already created
- Use TypeORM entities to map to existing tables
- **DO NOT create migration files** - schema already exists
- Use `synchronize: false` in TypeORM config
- Column naming: snake_case in database, camelCase in TypeScript entities
- Identity columns use BIGINT IDENTITY(1,1)

## Key Database Tables (Sample)
- Employee (employee_id, first_name, last_name, email, username, password_hash, department_id)
- Customer (customer_id, first_name, last_name, email, customer_type, registration_date)
- ServiceConnection (connection_id, customer_id, utility_type_id, connection_status, meter_id)
- Meter (meter_id, meter_serial_no, utility_type_id, installation_date, status)
- Bill (bill_id, meter_id, billing_period_start, billing_period_end, total_amount)
- Payment (payment_id, bill_id, payment_amount, payment_date, payment_method)

## Authentication Flow
1. Employee logs in with username/password
2. Backend validates credentials, returns JWT token
3. Frontend stores token in httpOnly cookie or localStorage
4. Protected routes check for valid token
5. Role-based permissions (Manager, FieldOfficer, Cashier, Admin, MeterReader)

## API Conventions
- Base URL: `/api/v1`
- RESTful endpoints: GET /customers, POST /customers, GET /customers/:id
- Response format: `{ success: boolean, data: any, message?: string, error?: string }`
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Pagination: query params `?page=1&limit=10`
- Filtering: query params `?customerType=RESIDENTIAL&status=ACTIVE`
- Sorting: query params `?sortBy=createdAt&order=DESC`

## NestJS Module Structure
src/
├── auth/                 # Authentication module
├── customers/            # Customer management
├── employees/            # Employee management
├── connections/          # Service connections
├── meters/               # Meter management
├── readings/             # Meter readings
├── billing/              # Billing system
├── payments/             # Payment processing
├── work-orders/          # Work order management
├── inventory/            # Inventory & warehouse
├── common/               # Shared utilities
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── filters/
└── database/             # TypeORM entities

## Next.js Structure
app/
├── (auth)/
│   └── login/
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx          # Main dashboard
│   ├── customers/
│   ├── connections/
│   ├── meters/
│   ├── billing/
│   └── payments/
├── api/                  # Optional API routes for SSR
└── components/
├── ui/               # Reusable UI components
├── forms/            # Form components
└── layouts/          # Layout components

## Naming Conventions
- **Files:** kebab-case (customer.service.ts, billing-history.tsx)
- **Classes:** PascalCase (CustomerService, BillingController)
- **Interfaces:** PascalCase with 'I' prefix or without (ICustomer or Customer)
- **Types:** PascalCase (CustomerType, BillStatus)
- **Functions:** camelCase (getCustomerById, calculateBillAmount)
- **Constants:** UPPER_SNAKE_CASE (API_BASE_URL, MAX_FILE_SIZE)
- **Components:** PascalCase (CustomerList, BillingForm)

## Security Best Practices
- Hash passwords with bcrypt (salt rounds: 10)
- Validate all inputs with class-validator
- Sanitize user inputs to prevent SQL injection
- Use parameterized queries (TypeORM handles this)
- Implement rate limiting for API endpoints
- Use CORS with specific origins
- Set secure HTTP headers (helmet)
- Implement CSRF protection for forms
- Use HTTPS in production

## Error Handling
- Use NestJS exception filters
- Return consistent error format
- Log errors with proper context
- Don't expose sensitive information in error messages
- Use try-catch blocks in services
- Handle database errors gracefully

## Testing (Future Phase)
- Unit tests with Jest
- E2E tests with Supertest (backend)
- Component tests with React Testing Library (frontend)
- Test coverage target: 80%

## Performance Considerations
- Implement pagination for large datasets
- Use database indexes for frequently queried columns
- Cache frequently accessed data (Redis in future)
- Optimize database queries (avoid N+1 problems)
- Use lazy loading for relationships
- Implement request throttling
- Compress API responses

## Current Phase: Phase 1 - Foundation & Authentication
Focus on:
1. Setting up NestJS project with TypeORM and SQL Server
2. Creating Employee entity and auth module
3. Implementing JWT authentication
4. Setting up Next.js with App Router
5. Creating login page and dashboard layout
6. Implementing protected routes