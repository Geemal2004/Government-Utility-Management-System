# Copilot Instructions for Utility Management System

When generating code for this project:

1. **Always use TypeScript** with strict mode
2. **Follow the existing file structure** in the project
3. **Use TypeORM entities** that map to existing SQL Server tables
4. **Don't create database migrations** - schema already exists
5. **Implement proper error handling** in all services
6. **Add validation** using class-validator decorators
7. **Use async/await** for all async operations
8. **Follow RESTful conventions** for API endpoints
9. **Add Swagger decorators** for API documentation
10. **Implement role-based access control** where appropriate
11. **Use Tailwind CSS** for all styling (no custom CSS)
12. **Create responsive designs** (mobile-first approach)
13. **Add loading states** for all async operations
14. **Handle errors gracefully** with user-friendly messages
15. **Use TypeScript types** from shared types when available

Database column naming: snake_case (e.g., customer_id, first_name)
TypeScript property naming: camelCase (e.g., customerId, firstName)

Current phase: Phase 1 - Foundation & Authentication
Focus on Employee login and basic dashboard structure.