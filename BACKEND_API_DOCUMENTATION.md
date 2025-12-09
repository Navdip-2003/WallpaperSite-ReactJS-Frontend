# Backend API Documentation

This document describes all the API endpoints your NestJS backend needs to provide for the React frontend to work correctly.

## Base URL
```
http://localhost:3000
```

## Authentication

All endpoints except `/auth/login` require JWT authentication. The frontend will send the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Login

**POST** `/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### 2. Upload Image

**POST** `/images/upload`

Uploads an image to Cloudinary and stores metadata in MongoDB.

**Authentication:** Required (JWT Bearer Token)

**Request Type:** `multipart/form-data`

**Form Fields:**
- `title` (string, required): Title of the image
- `category` (string, required): Category (Nature, Animals, People, Architecture, Other)
- `image` (file, required): Image file (PNG, JPG, GIF)

**Success Response (201 Created):**
```json
{
  "_id": "64abc123def456789",
  "title": "Beautiful Sunset",
  "category": "Nature",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/sample.jpg",
  "publicId": "sample",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Invalid file format or missing required fields"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### 3. Get All Images

**GET** `/images`

Retrieves all images or filtered by category.

**Authentication:** Required (JWT Bearer Token)

**Query Parameters:**
- `category` (string, optional): Filter by category (Nature, Animals, People, Architecture, Other)

**Example Requests:**
```
GET /images
GET /images?category=Nature
GET /images?category=Animals
```

**Success Response (200 OK):**
```json
[
  {
    "_id": "64abc123def456789",
    "title": "Beautiful Sunset",
    "category": "Nature",
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/sample.jpg",
    "publicId": "sample",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64abc123def456790",
    "title": "Mountain View",
    "category": "Nature",
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567891/mountain.jpg",
    "publicId": "mountain",
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
]
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Database Schema (MongoDB)

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date
}
```

### Images Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  category: String (required, enum: ['Nature', 'Animals', 'People', 'Architecture', 'Other']),
  imageUrl: String (required, cloudinary URL),
  publicId: String (required, cloudinary public ID for deletion),
  userId: ObjectId (reference to Users, required),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Environment Variables for NestJS Backend

Create a `.env` file in your backend root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/image-gallery
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/image-gallery

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server
PORT=3000
```

---

## CORS Configuration

Your NestJS backend must enable CORS to allow requests from the React frontend:

```typescript
// In main.ts
app.enableCors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
});
```

---

## Implementation Notes

### Authentication
- Use `bcrypt` to hash passwords before storing in MongoDB
- Use `@nestjs/jwt` and `@nestjs/passport` for JWT authentication
- Implement a JWT strategy to validate tokens on protected routes

### Image Upload
- Use `multer` middleware to handle multipart/form-data
- Use `cloudinary` npm package to upload files
- Store the returned Cloudinary URL and public ID in MongoDB
- Validate file types (only allow images)
- Set maximum file size limit (e.g., 10MB)

### Database
- Use `@nestjs/mongoose` for MongoDB integration
- Create schemas for User and Image models
- Ensure proper indexing on frequently queried fields

### Error Handling
- Return consistent error responses with proper HTTP status codes
- Include meaningful error messages
- Handle validation errors from MongoDB and Cloudinary

---

## Testing the API

You can test your backend endpoints using tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example curl for login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Example curl for upload:
```bash
curl -X POST http://localhost:3000/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Test Image" \
  -F "category=Nature" \
  -F "image=@/path/to/image.jpg"
```
