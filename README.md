# Banquet Booking System - Backend API

A comprehensive backend system for managing banquet bookings with role-based access control (RBAC), built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **RBAC System**: Superadmin, Admin, and Owner roles with granular permissions
- **RESTful API**: Complete CRUD operations for Users, Businesses, Venues, and Packages
- **Data Validation**: Request validation using Joi schemas
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Security**: Helmet, CORS, rate limiting, and input sanitization
- **Database**: MongoDB with Mongoose ODM
- **TypeScript**: Full type safety and modern JavaScript features
- **Clean Architecture**: Modular structure with controllers, services, and middlewares

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: Helmet, CORS, bcryptjs
- **Environment**: dotenv

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd banquet-booking-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Start development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
npm start
```

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   └── environment.ts # Environment variables
├── controllers/     # Request handlers
├── middlewares/     # Custom middlewares
├── models/          # Mongoose schemas
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
└── app.ts           # Application entry point
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and queries, please contact the development team or create an issue in the repository.

---

Built with ❤️ using Node.js, Express, and TypeScript