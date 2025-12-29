# Government Utility Management System

A comprehensive full-stack application for managing water, electricity, and gas utilities including customer management, billing, meter reading, payments, work orders, inventory, and HR/payroll.

## Project Structure

```
GOVERNMENT UTILITY MANAGEMENT SYSTEM/
├── backend/                    # NestJS Backend API
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── guards/        # Auth guards (JWT, Roles)
│   │   │   ├── interfaces/    # TypeScript interfaces
│   │   │   └── strategies/    # Passport strategies
│   │   ├── common/            # Shared utilities
│   │   │   ├── decorators/    # Custom decorators
│   │   │   ├── dto/           # Shared DTOs
│   │   │   └── filters/       # Exception filters
│   │   ├── database/          # Database configuration
│   │   │   └── entities/      # TypeORM entities
│   │   ├── employees/         # Employee management module
│   │   │   └── dto/           # Employee DTOs
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                   # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── dashboard/     # Dashboard pages
│   │   │   └── login/         # Login page
│   │   ├── components/        # React components
│   │   │   ├── layouts/       # Layout components
│   │   │   └── ui/            # UI components
│   │   ├── contexts/          # React contexts
│   │   ├── lib/               # Utility functions & API client
│   │   └── types/             # TypeScript types
│   ├── .env.local             # Environment variables
│   └── package.json
│
├── database/                   # Database scripts
│   └── seed.sql               # Seed data for testing
│
└── schema.sql                  # Database schema
```

## Tech Stack

### Backend

- **Framework:** NestJS 10
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** Microsoft SQL Server
- **Authentication:** JWT with Passport
- **Documentation:** Swagger/OpenAPI

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Microsoft SQL Server
- npm or yarn

### Database Setup

1. Create a new database called `UtilityManagementDB` in SQL Server

2. Run the schema script:

   ```sql
   -- Execute schema.sql in SQL Server Management Studio
   ```

3. Run the seed script for test users:
   ```sql
   -- Execute database/seed.sql
   ```

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:

   ```env
   # For Windows Authentication
   DB_HOST=localhost
   DB_PORT=1433
   DB_DATABASE=UtilityManagementDB
   DB_TRUST_SERVER_CERTIFICATE=true

   # For SQL Server Authentication (uncomment and set)
   # DB_USERNAME=your_username
   # DB_PASSWORD=your_password

   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=8h
   PORT=3001
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the development server:

   ```bash
   npm run start:dev
   ```

5. Access Swagger documentation at: http://localhost:3001/api/docs

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Access the application at: http://localhost:3000

## Test Users

After running the seed script, you can login with these accounts:

| Username     | Password    | Role         |
| ------------ | ----------- | ------------ |
| admin        | password123 | Admin        |
| manager      | password123 | Manager      |
| cashier      | password123 | Cashier      |
| fieldofficer | password123 | FieldOfficer |
| meterreader  | password123 | MeterReader  |

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Employee login
- `GET /api/v1/auth/profile` - Get current user profile

### Employees

- `GET /api/v1/employees` - List all employees (paginated)
- `GET /api/v1/employees/:id` - Get employee by ID

## Development Phases

1. ✅ **Phase 1:** Foundation + Authentication
2. ⬜ **Phase 2:** Customer Management
3. ⬜ **Phase 3:** Service Connections
4. ⬜ **Phase 4:** Meter & Readings
5. ⬜ **Phase 5:** Billing System
6. ⬜ **Phase 6:** Payments
7. ⬜ **Phase 7:** Employee & HR
8. ⬜ **Phase 8:** Work Orders & Maintenance
9. ⬜ **Phase 9:** Inventory & Warehouse
10. ⬜ **Phase 10:** Advanced Features
11. ⬜ **Phase 11:** Reporting & Analytics
12. ⬜ **Phase 12:** Testing & Deployment

## License

This project is proprietary and confidential.
