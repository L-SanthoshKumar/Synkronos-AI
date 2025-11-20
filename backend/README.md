# AI Job Portal Backend

This is the Node.js + Express backend for the AI-Powered Job Recommendation Portal. It provides a RESTful API for user authentication, job management, and application processing.

## 🚀 Features
- **User Authentication**: JWT-based login/register system
- **Role-based Access Control**: Job Seeker and Recruiter roles
- **Job Management**: CRUD operations for job postings
- **Application System**: Handle job applications with resume uploads
- **Search & Filtering**: Advanced job search with multiple filters
- **File Upload**: Secure handling of resume uploads with Multer
- **MongoDB Integration**: Data persistence with Mongoose ODM
- **CORS & Security**: Secure API endpoints with proper CORS configuration

## 🛠️ Tech Stack
- Node.js 18+
- Express.js
- MongoDB + Mongoose
- JWT for authentication
- Multer for file uploads
- CORS middleware
- Nodemon for development
- Jest for testing

## 📦 Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and update the values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-portal
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
UPLOAD_DIR=./uploads
```

### 3. Start the development server
```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

## 🐳 Docker Usage

Build and run with Docker Compose:
```bash
docker-compose up --build
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `POST /api/jobs` - Create a new job (Recruiter only)
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job (Recruiter only)
- `DELETE /api/jobs/:id` - Delete job (Recruiter only)

### Applications
- `POST /api/applications` - Apply for a job
- `GET /api/applications` - Get user's applications
- `GET /api/applications/job/:jobId` - Get applications for a job (Recruiter only)
- `PUT /api/applications/:id/status` - Update application status (Recruiter only)

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🔒 Security

- Input validation and sanitization
- Rate limiting
- Helmet for security headers
- CORS configuration
- Secure file upload handling

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| NODE_ENV | Environment (development/production) | development |
| UPLOAD_DIR | Directory for file uploads | ./uploads |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
