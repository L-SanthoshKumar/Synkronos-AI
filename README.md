________________SYNKRONOS-AI________________



# 🚀 AI-Powered Job Recommendation Portal

Synkronos AI is an AI-powered job recommendation and talent-matching platform designed to connect candidates with the most suitable job opportunities. The system intelligently analyzes resumes, extracts relevant skills, compares them with job descriptions, and generates an accurate job-fit score. This helps both job seekers and recruiters make faster, smarter, and data-driven hiring decisions.


## ✨ Key Features

### For Job Seekers
- **Smart Job Matching**: AI-powered job recommendations based on resume analysis
- **Advanced Search**: Filter jobs by title, company, location, skills, and more
- **One-Click Apply**: Easy application process with resume upload
- **Application Tracking**: Monitor the status of all your applications
- **Skill Analysis**: Get insights into your skills and how they match job requirements

### For Recruiters
- **Efficient Hiring**: Post and manage job listings with ease
- **Applicant Tracking**: Review and manage applications in one place
- **AI-Powered Screening**: Automatically rank candidates based on job requirements
- **Analytics Dashboard**: Track application metrics and hiring progress

## 🏗️ Project Architecture

```
ai-job-portal/
├── frontend/          # React.js 18+ with Tailwind CSS
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API service layer
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
│
├── backend/           # Node.js + Express API
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Custom middleware
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API routes
│   └── services/      # Business logic
│
├── ml-engine/         # Python Flask AI/ML service
│   ├── app/           # Application package
│   │   ├── models/    # ML models
│   │   ├── services/  # Business logic
│   │   └── api/       # API endpoints
│   └── tests/         # Test files
│
├── docker/            # Docker configuration
└── docs/              # Documentation
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18+ with Hooks
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **UI Components**: Headless UI, React Icons
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **File Upload**: Multer with cloud storage
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI

### AI/ML Engine
- **Language**: Python 3.8+
- **Web Framework**: Flask
- **NLP**: spaCy with custom pipelines
- **ML**: scikit-learn, TensorFlow
- **PDF Processing**: PyMuPDF
- **Data Processing**: pandas, NumPy
- **Testing**: pytest

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- MongoDB 5.0+
- Git
- Docker (optional)

### Quick Start with Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-job-portal
   ```

2. Copy the example environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp ml-engine/.env.example ml-engine/.env
   ```

3. Update the environment variables as needed

4. Start the application with Docker Compose:
   ```bash
   docker-compose up --build
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs
   - ML Engine: http://localhost:5001

### Manual Setup

#### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Update .env with your backend API URL
npm run dev
```

#### 3. ML Engine Setup

```bash
cd ml-engine
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
# Update .env with your configuration
python app.py
```

## 📚 Documentation

### API Documentation

Explore the API documentation using Swagger UI at `http://localhost:5000/api-docs` when the backend is running.

### Architecture Decision Records (ADR)

Key architectural decisions are documented in `docs/adr/`.

### Deployment Guide

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- [spaCy](https://spacy.io/) for NLP capabilities
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the frontend
- [Express](https://expressjs.com/) for the backend API
- [MongoDB](https://www.mongodb.com/) for data storage
- The open-source community for countless libraries and tools

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### ML Engine Tests
```bash
cd ml-engine
python -m pytest tests/
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request



## 🆘 Support


For support and questions, please open an issue on GitHub or contact the development team. 

---

## **What This Means**

- The backend expects a `contact.email` field in your job creation payload.
- This is a required field for each job (see your Job model).

---


If you want, I can make the exact code change for you—just let me know! 
