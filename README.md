# React Image Gallery Application

A complete React application for managing and displaying images with authentication, built with TypeScript, Vite, and Tailwind CSS. This frontend connects to a NestJS backend with MongoDB and Cloudinary.

## Features

- User authentication with JWT
- Image upload with preview
- Category-based filtering
- Protected routes
- Responsive design
- Modern UI with Tailwind CSS

## Project Structure

```
src/
├── components/
│   ├── Navigation.tsx          # Navigation bar component
│   └── ProtectedRoute.tsx      # Route protection wrapper
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── lib/
│   └── axios.ts               # Axios instance with interceptors
├── pages/
│   ├── Login.tsx              # Login page
│   ├── Dashboard.tsx          # Dashboard with recent images
│   ├── ImageUpload.tsx        # Image upload form
│   └── ImageListing.tsx       # Gallery with filters
├── App.tsx                    # Main app with routing
├── main.tsx                   # App entry point
└── index.css                  # Global styles
```

## Prerequisites

- Node.js 18+ and npm
- NestJS backend running on http://localhost:3000
- Backend must have the required API endpoints (see BACKEND_API_DOCUMENTATION.md)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
SERVER_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Pages and Routes

### Login Page (`/login`)
- Email and password form
- Calls `POST /auth/login`
- Stores JWT token in localStorage
- Redirects to dashboard on success

### Dashboard (`/dashboard`)
- Protected route (requires authentication)
- Shows recent uploaded images (up to 6)
- Quick access buttons to upload and view all images
- Navigation to other pages

### Image Upload (`/upload`)
- Protected route
- Form with title input, category selector, and file upload
- Image preview before upload
- Submits as `multipart/form-data` to `POST /images/upload`
- Redirects to dashboard on success

### Image Listing (`/images`)
- Protected route
- Displays all images in a grid
- Category filter buttons (All, Nature, Animals, People, Architecture, Other)
- Fetches from `GET /images?category=<category>`

## Authentication

- JWT tokens are stored in localStorage
- Axios interceptor automatically adds token to requests
- Protected routes redirect to login if not authenticated
- 401 responses automatically clear token and redirect to login

## API Integration

The frontend expects these backend endpoints:

1. **POST** `/auth/login` - User login
2. **POST** `/images/upload` - Upload image (multipart/form-data)
3. **GET** `/images` - Get all images (optional query param: `category`)

See `BACKEND_API_DOCUMENTATION.md` for detailed API specifications.

## Environment Variables

### Frontend (.env)
```env
SERVER_URL=http://localhost:3000
```

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/image-gallery
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=24h
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PORT=3000
```

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## Backend Requirements

This frontend requires a NestJS backend with:
- MongoDB for data persistence
- Cloudinary for image storage
- JWT authentication
- CORS enabled for `http://localhost:5173`

Refer to `BACKEND_API_DOCUMENTATION.md` for complete backend implementation details.

## Production Build

To create a production build:

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Troubleshooting

### CORS Errors
Ensure your NestJS backend has CORS enabled for the frontend URL.

### 401 Unauthorized
Check that your JWT token is valid and the backend authentication is working.

### Image Upload Fails
- Verify file size is under 10MB
- Check that backend Cloudinary credentials are correct
- Ensure multipart/form-data is properly configured in backend

### API Connection Issues
- Verify backend is running on the correct port
- Check `SERVER_URL` in `.env` file
- Ensure all required API endpoints are implemented
