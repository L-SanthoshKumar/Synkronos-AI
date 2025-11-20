# AI Job Portal Frontend

This is the React.js frontend for the AI-Powered Job Recommendation Portal. It provides a modern, responsive UI for job seekers and recruiters, with AI-powered job recommendations.

## 🚀 Features
- **User Authentication**: Secure JWT-based login/register system
- **Role-based Access**: Tailored interfaces for Job Seekers and Recruiters
- **Job Search & Filtering**: Advanced search with multiple filters
- **Job Applications**: Easy application process with resume upload
- **Recruiter Dashboard**: Comprehensive tools for managing jobs and applicants
- **AI-Powered Matching**: Smart job recommendations based on resume analysis
- **Profile Management**: Update personal information and track applications
- **Responsive Design**: Fully responsive UI built with Tailwind CSS
- **Dark Mode**: User-friendly dark/light theme support

## 🛠️ Tech Stack
- React 18+ with Hooks
- React Router v6 for navigation
- Tailwind CSS for styling
- Axios for API requests
- React Hook Form for form handling
- React Toastify for notifications
- React Icons for UI icons
- React Dropzone for file uploads

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Backend API server (see backend README)
- ML Engine service (see ML Engine README)

### 1. Clone the repository
```bash
git clone <repository-url>
cd ai-job-portal/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and update the values:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_API_URL=http://localhost:5001
```

### 4. Start the development server
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## 🐳 Docker Usage

### Build the Docker image
```bash
docker build -t job-portal-frontend .
```

### Run the container
```bash
docker run -p 3000:3000 --env-file .env job-portal-frontend
```

## 📁 Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable UI components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── layouts/         # Layout components
├── pages/           # Page components
│   ├── jobseeker/   # Job seeker specific pages
│   └── recruiter/   # Recruiter specific pages
├── services/        # API service layer
└── utils/           # Utility functions
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## 🔧 Development

### Available Scripts
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from create-react-app
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |
| REACT_APP_ML_API_URL | ML Engine API URL | http://localhost:5001 |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 📚 Main Pages
- `/login` — Login
- `/register` — Register
- `/jobs` — Job Listings (with filters)
- `/apply/:jobId` — Apply for a job
- `/profile` — Profile & AI recommendations
- `/recruiter/dashboard` — Recruiter dashboard

## 🔗 Integration
- Connects to the backend API (`REACT_APP_API_URL`)
- Calls the ML engine for resume-based job recommendations (`REACT_APP_ML_API_URL`)

## 📝 Notes
- Make sure the backend and ML engine are running for full functionality
- You can customize Tailwind styles in `tailwind.config.js` and `index.css`

## 📄 License
MIT 