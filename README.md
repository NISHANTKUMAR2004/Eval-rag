# EvalGuard AI - RAG Evaluation Platform

A comprehensive full-stack platform for evaluating Retrieval-Augmented Generation (RAG) systems. EvalGuard AI enables users to upload documents, create evaluation datasets with test cases, run batch evaluations, and inspect detailed results.

## 🎯 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Project Management**: Create and manage multiple evaluation projects
- **Document Upload**: Upload text and markdown documents (PDF support coming)
- **Automatic Chunking**: Documents are automatically split into chunks for efficient processing
- **Dataset Creation**: Create evaluation datasets for your projects
- **Test Case Management**: Define test cases with questions and expected answers
- **Batch Evaluation Runs**: Execute evaluations across multiple test cases
- **Detailed Results**: Inspect evaluation results with multiple scoring metrics (faithfulness, relevance, correctness)
- **Dashboard**: Overview of projects, documents, datasets, and evaluation runs
- **Responsive UI**: Clean, intuitive interface built with React and Tailwind CSS

## 🏗️ Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (jsonwebtoken)
- **Migrations**: Alembic
- **Validation**: Pydantic
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Package Manager**: npm

## 📦 Project Structure

```
Eval-guard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # API endpoint definitions
│   │   │   └── deps.py          # Dependency injection
│   │   ├── core/
│   │   │   ├── config.py        # Configuration settings
│   │   │   ├── security.py      # JWT and auth utilities
│   │   │   └── exceptions.py    # Custom exceptions
│   │   ├── db/
│   │   │   ├── models/          # SQLAlchemy models
│   │   │   ├── base.py          # Database base classes
│   │   │   └── session.py       # Database session management
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── services/            # Business logic layer
│   │   └── main.py              # FastAPI app initialization
│   ├── alembic/                 # Database migrations
│   ├── storage/                 # Uploaded documents storage
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Container configuration
│   └── docker-compose.yml       # Multi-container orchestration
│
└── frontend/
    ├── src/
    │   ├── api/                 # API client functions
    │   ├── components/          # Reusable React components
    │   ├── layouts/             # Layout components (AppLayout)
    │   ├── pages/               # Page components
    │   ├── types/               # TypeScript type definitions
    │   ├── utils/               # Utility functions
    │   └── App.tsx              # Main app with routing
    ├── public/                  # Static assets
    ├── index.html               # HTML entry point
    ├── package.json             # Node.js dependencies
    ├── vite.config.ts           # Vite configuration
    └── tsconfig.json            # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (Backend)
- Node.js 16+ (Frontend)
- PostgreSQL 12+ (Database)

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

2. **Configure environment** (create `.env` file):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/evalguard_ai
SECRET_KEY=your-secret-key-here
DEBUG=True
```

3. **Create database and run migrations**:
```bash
alembic upgrade head
```

4. **Start the backend server**:
```bash
uvicorn app.main:app --reload
# Backend runs at http://127.0.0.1:8000
# API docs available at http://127.0.0.1:8000/docs
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Start development server**:
```bash
npm run dev
# Frontend runs at http://localhost:5173
```

3. **Build for production**:
```bash
npm run build
npm run preview
```

## 🔐 Environment Variables

### Backend (.env)
```
APP_NAME=EvalGuard AI
APP_ENV=development
DEBUG=True
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/evalguard_ai
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
API_V1_PREFIX=/api/v1
UPLOAD_DIR=storage/documents
MAX_UPLOAD_SIZE_MB=10
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Dashboard
- `GET /api/v1/dashboard/stats` - Get overall statistics

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/{id}` - Get project details
- `DELETE /api/v1/projects/{id}` - Delete project

### Documents
- `GET /api/v1/projects/{project_id}/documents` - List documents
- `POST /api/v1/projects/{project_id}/documents` - Upload document
- `GET /api/v1/projects/{project_id}/documents/{id}` - Get document details
- `DELETE /api/v1/projects/{project_id}/documents/{id}` - Delete document

### Chunks
- `GET /api/v1/projects/{project_id}/documents/{document_id}/chunks` - List chunks

### Datasets
- `GET /api/v1/projects/{project_id}/datasets` - List datasets
- `POST /api/v1/projects/{project_id}/datasets` - Create dataset
- `GET /api/v1/projects/{project_id}/datasets/{id}` - Get dataset details
- `DELETE /api/v1/projects/{project_id}/datasets/{id}` - Delete dataset

### Test Cases
- `GET /api/v1/projects/{project_id}/datasets/{dataset_id}/test-cases` - List test cases
- `POST /api/v1/projects/{project_id}/datasets/{dataset_id}/test-cases` - Create test case
- `DELETE /api/v1/projects/{project_id}/datasets/{dataset_id}/test-cases/{id}` - Delete test case

### Batch Evaluations (Main Feature!)
- `GET /api/v1/projects/{project_id}/datasets/{dataset_id}/batch-runs` - List evaluation runs
- `POST /api/v1/projects/{project_id}/datasets/{dataset_id}/batch-runs` - Create evaluation run
- `GET /api/v1/projects/{project_id}/datasets/{dataset_id}/batch-runs/{id}` - Get evaluation run details

## 🔄 User Flow

1. **Register/Login**: Create account or sign in to access the platform
2. **Create Project**: Start a new evaluation project
3. **Upload Documents**: Upload text or markdown files to index
4. **Review Chunks**: Verify how documents are split into chunks
5. **Create Dataset**: Define evaluation dataset within the project
6. **Add Test Cases**: Create test cases with questions and expected answers
7. **Run Evaluation**: Execute batch evaluation on the dataset
8. **Review Results**: Inspect detailed evaluation metrics and scores
9. **Iterate**: Create more datasets or test cases as needed

## 🗄️ Database Schema

### Key Tables
- **users**: User accounts and authentication
- **projects**: User's evaluation projects
- **documents**: Uploaded documents
- **document_chunks**: Text chunks extracted from documents
- **evaluation_datasets**: Evaluation datasets within projects
- **test_cases**: Test cases within datasets
- **batch_evaluation_runs**: Evaluation run executions
- **evaluation_results**: Individual evaluation results per test case

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests (if configured)
```bash
cd frontend
npm run test
```

## 🛠️ Development

### Code Quality
- **Backend**: Type hints with Python typing, Pydantic validation
- **Frontend**: TypeScript, ESLint configuration

### Logging
- Backend: Structured logging with Python logging module
- Frontend: Console logs and error reporting

## 🚢 Deployment

### Docker Deployment
```bash
cd backend
docker build -t evalguard-api .
docker run -p 8000:8000 -e DATABASE_URL=... evalguard-api

cd frontend
docker build -t evalguard-ui .
docker run -p 5173:5173 evalguard-ui
```

### Docker Compose
```bash
docker-compose up -d
```

## 🔮 Future Improvements

- [ ] PDF document support
- [ ] Advanced filtering and search
- [ ] Batch operations for test cases
- [ ] Custom evaluation metrics
- [ ] LLM model selection (GPT-4, Claude, Llama, etc.)
- [ ] Result visualization and charts
- [ ] Export results to CSV/PDF
- [ ] User team collaboration
- [ ] API rate limiting
- [ ] Webhooks for evaluation completion
- [ ] Real-time evaluation progress updates

## 🐛 Troubleshooting

### Backend Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure port 8000 is available

### Frontend Can't Connect to Backend
- Check `VITE_API_BASE_URL` configuration
- Verify backend is running at http://127.0.0.1:8000
- Check CORS settings in backend

### Token/Authentication Issues
- Check `evalguard_token` in browser localStorage
- Verify JWT secret key is consistent
- Ensure token is included in request headers

## 📄 License

This project is part of an interview portfolio and is provided as-is.

## 📧 Questions?

For questions about this project, refer to the interview explanation document in `docs/INTERVIEW_EXPLANATION.md`.
