# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **banquet booking system backend API** built with **Node.js, Express, TypeScript, and MongoDB**. It implements a comprehensive **Role-Based Access Control (RBAC)** system with three primary roles: superadmin, admin, and owner.

## Development Commands

### Essential Commands
```bash
# Development server with hot reload
npm run dev

# Build the project
npm run build

# Production server (requires build first)
npm start

# Run linting
npm run lint

# Run tests
npm test
```

### Environment Setup
```bash
# Copy environment template and configure
cp .env.example .env
```

### MongoDB Connection
The application uses MongoDB with Mongoose ODM. Ensure MongoDB is running locally or configure `MONGO_URI` in `.env` for remote connection.

## Architecture Overview

### Core Application Structure
- **Entry Point**: `src/app.ts` - Express application class with middleware initialization
- **Database**: MongoDB with Mongoose ODM, singleton connection pattern in `src/config/db.ts`
- **Authentication**: JWT-based with Bearer token authorization
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing

### RBAC System Architecture
The permission system is the most complex part of this codebase:

**Role Hierarchy:**
- `superadmin` - Full system access
- `admin` - Business-level management
- `owner` - Limited vendor/business operations

**Permission Resolution Flow:**
1. `authMiddleware` validates JWT and sets `req.user`
2. `rolesMiddleware` resolves business context from request params/body
3. `requirePerm()` guards enforce specific permissions

**Business Context Resolution:**
The system automatically resolves `businessId` from:
- `req.params.businessId` (direct)
- `req.params.venueId` → lookup `Venue.businessId`
- `req.params.packageId` → lookup `Package.venueId` → `Venue.businessId`
- `req.body.businessId` or `req.body.venueId` (fallback)

### Data Models
- **User** - Basic user authentication and profile
- **Business** - Top-level business entity with owner
- **UserBusinessRole** - Junction table for RBAC permissions
- **Venue** - Physical locations belonging to businesses
- **Package** - Service packages offered at venues

### Service Layer Pattern
Each entity follows a consistent pattern:
- **Controller** - HTTP request handling
- **Service** - Business logic and data validation
- **Model** - Mongoose schema and database operations
- **Route** - Express route definitions with middleware

## Key Development Patterns

### Middleware Chain
Most protected routes follow this pattern:
```typescript
router.post('/', authMiddleware, rolesMiddleware, requirePerm('permission.name'), controller.method)
```

### Error Handling
- Global error handler in `src/middlewares/errorHandler.ts`
- Joi validation in `src/middlewares/validate.ts`
- Consistent API response format with `success` boolean

### Type Safety
- Custom interfaces in `src/types/index.ts`
- Extended Express Request with user context in `src/types/express.d.ts`
- Mongoose document interfaces for all models

## API Structure

Base URL: `/api`

**Core Endpoints:**
- `/api/auth/*` - Authentication (register, login, profile)
- `/api/businesses/*` - Business management
- `/api/venues/*` - Venue management
- `/api/packages/*` - Package management
- `/api/health` - Health check
- `/api/docs` - Auto-generated API documentation

## Testing & Debugging

### Running Individual Tests
```bash
# Run specific test file (when implemented)
npx jest src/tests/specific-test.test.ts

# Run tests in watch mode
npx jest --watch
```

### Development Debugging
- Development requests are logged with timestamp in console
- Health endpoint: `GET /api/health`
- API documentation: `GET /api/docs`

## Common Development Tasks

### Adding New Permissions
1. Add to `PERMS` constant in `src/middlewares/roles.ts`
2. Update `ROLE_TO_PERMS` mapping for appropriate roles
3. Use `requirePerm()` middleware on relevant routes

### Adding New Routes
1. Create controller in `src/controllers/`
2. Create service in `src/services/`
3. Define routes in `src/routes/`
4. Add route import to `src/routes/index.ts`
5. Update API documentation in `src/routes/index.ts`

### Database Seeding
Use `src/scripts/seed.ts` for database initialization and test data.

## Deployment Notes

- **Vercel Configuration**: `vercel.json` configured for serverless deployment
- **Build Output**: Compiled JavaScript in `dist/` directory
- **Environment**: Production settings via environment variables
- **Rate Limiting**: More restrictive in production (100 requests/15min vs 1000 in dev)
