# Quick Start Guide

This guide will help you get the complete image gallery application up and running.

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Cloudinary account (free tier is sufficient)
- Git

---

## Part 1: Backend Setup (NestJS)

### 1. Create a New NestJS Project

```bash
npm i -g @nestjs/cli
nest new image-gallery-backend
cd image-gallery-backend
```

### 2. Install Required Dependencies

```bash
npm install @nestjs/mongoose mongoose
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt
npm install cloudinary multer
npm install @nestjs/config
npm install class-validator class-transformer
npm install @types/bcrypt @types/multer @types/passport-jwt --save-dev
```

### 3. Create Environment File

Create `.env` in backend root:

```env
MONGODB_URI=mongodb://localhost:27017/image-gallery
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PORT=3000
```

### 4. Get Cloudinary Credentials

1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

### 5. Implement Backend Modules

You need to create:

**Modules:**
- Auth Module (login, JWT strategy)
- Images Module (upload, get images)
- Users Module (user management)

**Key Files:**
- `src/auth/auth.controller.ts` - Login endpoint
- `src/auth/auth.service.ts` - Authentication logic
- `src/auth/jwt.strategy.ts` - JWT validation
- `src/images/images.controller.ts` - Image endpoints
- `src/images/images.service.ts` - Image upload logic
- `src/schemas/user.schema.ts` - User model
- `src/schemas/image.schema.ts` - Image model

### 6. Enable CORS

In `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
```

### 7. Start Backend

```bash
npm run start:dev
```

Backend should be running on `http://localhost:3000`

---

## Part 2: Frontend Setup (React)

### 1. Navigate to Frontend Directory

If you're in the backend folder, go back and to the frontend:

```bash
cd ../image-gallery-frontend
```

### 2. Dependencies Already Installed

The dependencies are already installed. If not:

```bash
npm install
```

### 3. Create Environment File

Create `.env` in frontend root:

```env
SERVER_URL=http://localhost:3000
```

### 4. Start Frontend

```bash
npm run dev
```

Frontend should be running on `http://localhost:5173`

---

## Part 3: Testing the Application

### 1. Create a Test User

You need to manually create a user in MongoDB or implement a registration endpoint:

**Using MongoDB Compass or mongosh:**

```javascript
use image-gallery

// Hash this password: "password123"
// Use bcrypt to hash it, or implement a seed script

db.users.insertOne({
  email: "test@example.com",
  password: "$2b$10$YourHashedPasswordHere",
  createdAt: new Date()
})
```

Or use this NestJS script to hash a password:

```typescript
import * as bcrypt from 'bcrypt';

const password = 'password123';
const hashedPassword = await bcrypt.hash(password, 10);
console.log(hashedPassword);
```

### 2. Test Login

1. Open `http://localhost:5173` in your browser
2. You'll be redirected to `/login`
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Sign In"
5. You should be redirected to the Dashboard

### 3. Test Image Upload

1. Click "Upload New Image" or navigate to `/upload`
2. Enter a title (e.g., "Beautiful Sunset")
3. Select a category (e.g., "Nature")
4. Choose an image file from your computer
5. Click "Upload Image"
6. Image should upload to Cloudinary and appear in your gallery

### 4. Test Image Listing

1. Click "View All Images" or navigate to `/images`
2. You should see all uploaded images
3. Click category filter buttons to filter images
4. Images should update based on selected category

---

## Part 4: API Endpoints Reference

Refer to `BACKEND_API_DOCUMENTATION.md` for complete API specifications.

**Required Endpoints:**

1. `POST /auth/login` - Login
2. `POST /images/upload` - Upload image (multipart/form-data)
3. `GET /images?category=<optional>` - Get images

---

## Folder Structure

```
project-root/
├── image-gallery-backend/     # NestJS Backend
│   ├── src/
│   │   ├── auth/
│   │   ├── images/
│   │   ├── schemas/
│   │   └── main.ts
│   ├── .env
│   └── package.json
│
└── image-gallery-frontend/    # React Frontend (this folder)
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── lib/
    │   ├── pages/
    │   └── App.tsx
    ├── .env
    └── package.json
```

---

## Common Issues and Solutions

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in backend `.env`
- For Atlas, whitelist your IP address

### CORS Error
- Verify backend CORS configuration includes frontend URL
- Check that both servers are running on correct ports

### Image Upload Fails
- Verify Cloudinary credentials are correct
- Check file size is under 10MB
- Ensure backend multer middleware is configured

### JWT Token Issues
- Check JWT_SECRET is set in backend `.env`
- Verify token is being saved in localStorage
- Check Authorization header format

---

## Next Steps

- Implement user registration
- Add image deletion functionality
- Implement image editing
- Add pagination for large galleries
- Add search functionality
- Implement image details modal
- Add user profile page

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
