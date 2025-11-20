# AI Job Portal ML Engine

This is the AI/ML microservice for the AI-Powered Job Recommendation Portal. It parses resumes, extracts skills and experience, and provides intelligent job recommendations using NLP and machine learning techniques.

## 🚀 Features

### Resume Processing
- **PDF Parsing**: Extract text from PDF resumes using PyMuPDF
- **Text Extraction**: Clean and preprocess resume text
- **NLP Processing**: Tokenization, lemmatization, and entity recognition
- **Skill Extraction**: Identify and extract skills using NLP techniques
- **Experience Analysis**: Parse work history, education, and projects

### Job Matching
- **TF-IDF Vectorization**: Convert text to numerical features
- **Cosine Similarity**: Match resumes with job descriptions
- **Ranking**: Sort jobs by relevance score
- **Recommendations**: Return top matching jobs with confidence scores

### API Endpoints
- `POST /ml/match` - Get job recommendations based on resume
- `GET /health` - Health check endpoint

## 🛠️ Tech Stack

### Core
- Python 3.8+
- Flask (Web framework)
- Gunicorn (Production WSGI server)

### NLP & ML
- spaCy (NLP processing)
- scikit-learn (TF-IDF and similarity)
- PyMuPDF (PDF text extraction)
- NumPy (Numerical operations)
- Pandas (Data manipulation)

### Development & Testing
- pytest (Testing framework)
- black (Code formatting)
- flake8 (Linting)
- python-dotenv (Environment variables)

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### 1. Clone the repository
```bash
git clone <repository-url>
cd ai-job-portal/ml-engine
```

### 2. Create and activate a virtual environment (recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Download spaCy model
```bash
python -m spacy download en_core_web_sm
```

### 5. Environment Setup
Copy `.env.example` to `.env` and update the values:
```env
FLASK_APP=app.py
FLASK_ENV=development
BACKEND_API_URL=http://localhost:5000/api
PORT=5001
DEBUG=True
```

### 6. Run the Flask development server
```bash
python app.py
```

The service will be available at `http://localhost:5001`.

## 🐳 Docker Usage

### Build the Docker image
```bash
docker build -t job-portal-ml .
```

### Run the container
```bash
docker run -p 5001:5001 --env-file .env job-portal-ml
```

## 📚 API Endpoints

### `POST /ml/match`
- **Description**: Upload a resume (PDF) and get top 5 job recommendations.
- **Request**: `multipart/form-data` with `resume` file field
- **Response**:
  ```json
  {
    "success": true,
    "skills": ["python", "machine learning", ...],
    "experience_years": 3,
    "recommendations": [
      { "job": { ... }, "similarity": 0.82 },
      ...
    ]
  }
  ```

### `GET /health`
- **Description**: Health check endpoint

## 🔗 Integration
- The ML engine fetches job listings from the backend API (`BACKEND_API_URL`)
- Designed to be called from the frontend or backend for recommendations

## 📝 Notes
- For best results, use well-formatted PDF resumes
- You can extend skill extraction by customizing the spaCy pipeline or adding a skills dictionary

## 📄 License
MIT 