# EvalGuard AI - Interview Explanation Guide

This document provides a comprehensive explanation of EvalGuard AI for technical interviews.

## 🎯 Project Overview - The Elevator Pitch

"EvalGuard AI is a full-stack web application for evaluating Retrieval-Augmented Generation (RAG) systems. It allows users to upload documents, create test datasets, run batch evaluations, and inspect detailed results with multiple scoring metrics. The platform demonstrates full-stack development with React/TypeScript on the frontend and FastAPI/PostgreSQL on the backend."

## 🤔 Why This Project?

### Problem Being Solved
RAG systems are powerful but difficult to evaluate consistently. Before EvalGuard:
- No easy way to batch evaluate multiple test cases
- Results scattered across different tools
- No unified dashboard for seeing all metrics
- Time-consuming manual evaluation process

### Solution Value
EvalGuard provides:
- Centralized evaluation platform
- Automated batch processing
- Detailed metric tracking
- User-friendly interface
- Scalable architecture

## 💡 Technical Architecture Overview

### High-Level Flow
```
User Registration/Login
        ↓
Create Project
        ↓
Upload Documents → Automatic Chunking
        ↓
Create Dataset + Test Cases
        ↓
Run Batch Evaluation
        ↓
View Detailed Results
```

## 🔨 Backend Architecture (FastAPI + PostgreSQL)

### Key Design Decisions

#### 1. **Layered Architecture**
- **Routes Layer** (`api/routes/`) - HTTP endpoints, validation
- **Services Layer** (`services/`) - Business logic, orchestration  
- **Models Layer** (`db/models/`) - Data entities, relationships
- **Schemas Layer** (`schemas/`) - Pydantic request/response DTOs

**Why**: Clean separation of concerns, easy testing, maintainability

#### 2. **JWT Authentication**
```python
# Security flow
1. User credentials → JWT token generation
2. Token stored in localStorage on frontend
3. Token included in request headers as "Bearer {token}"
4. Backend validates token with secret key
```

**Why**: Stateless authentication, scalable, secure

#### 3. **Database Design**

**Core Tables**:
```
users (1) ──┐
            ├─→ projects (1) ──┐
                               ├─→ documents (1) ──→ document_chunks
                               ├─→ evaluation_datasets (1) ──→ test_cases
                               └─→ batch_evaluation_runs ──→ evaluation_results
```

**Key Relationships**:
- User owns Projects (one-to-many)
- Project owns Documents (one-to-many)
- Document has Chunks (one-to-many)
- Project owns EvaluationDatasets (one-to-many)
- Dataset owns TestCases (one-to-many)
- Dataset owns BatchEvaluationRuns (one-to-many)
- BatchRun has EvaluationResults (one-to-many)

**Why**: Normalized design prevents data duplication, supports queries efficiently

#### 4. **Service Layer Pattern**
```python
# Example: batch_evaluation_service.py
class BatchEvaluationService:
    def run_dataset_evaluation(self, db, project_id, dataset_id, ...):
        # 1. Validate project exists and user owns it
        # 2. Load all test cases for dataset
        # 3. For each test case, run RAG evaluation
        # 4. Calculate aggregate scores
        # 5. Persist results
        # 6. Return batch_run with results
```

**Why**: Testable, reusable, business logic separated from HTTP

### API Design Decisions

#### 1. **RESTful Conventions**
- `GET /projects` - List
- `POST /projects` - Create
- `GET /projects/{id}` - Detail
- `DELETE /projects/{id}` - Delete

**Why**: Standard, predictable, familiar to developers

#### 2. **Nested Resources**
```
/projects/{project_id}/documents
/projects/{project_id}/datasets/{dataset_id}/test-cases
/projects/{project_id}/datasets/{dataset_id}/batch-runs
```

**Why**: Clear hierarchy, shows resource relationships

#### 3. **Error Handling**
```python
# Centralized exception handling
if not project:
    raise HTTPException(404, "Project not found")

if not project.owner_id == user_id:
    raise HTTPException(403, "Not authorized")
```

**Why**: Consistent error responses, proper HTTP status codes

### Advanced Topics Demonstrated

1. **Alembic Migrations**
   - Version control for database schema
   - Reversible migrations
   - Track schema evolution

2. **Pydantic Validation**
   - Type validation on request/response
   - Custom validators
   - Error messages

3. **Dependency Injection**
   - `get_db()` - Database session
   - `get_current_user()` - Authentication
   - Reduces boilerplate, improves testability

## 🎨 Frontend Architecture (React + TypeScript)

### Key Design Decisions

#### 1. **Component Structure**
```
App (Routing)
  ├── ProtectedRoute (Auth guard)
  │   └── AppLayout (Header, nav, outlet)
  │       ├── DashboardPage
  │       ├── ProjectsPage
  │       ├── DocumentsPage
  │       └── EvaluationsPage
  └── LoginPage
```

**Why**: Clear hierarchy, protected routes, reusable layouts

#### 2. **Protected Routes**
```typescript
// Check token before rendering protected pages
export default function ProtectedRoute() {
  const token = localStorage.getItem("evalguard_token");
  if (!token) return <Navigate to="/login" />;
  return <Outlet />;
}
```

**Why**: Prevents unauthorized access, redirects to login

#### 3. **API Client Pattern**
```typescript
// Centralized API configuration
const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("evalguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage in services
export async function listProjects(userId: string) {
  const response = await apiClient.get(`/projects`);
  return response.data;
}
```

**Why**: Single source of truth, automatic token injection, consistent error handling

#### 4. **Type Safety with TypeScript**
```typescript
type ProjectItem = {
  id: string;
  name: string;
  description?: string | null;
};

// Props are typed
export default function ProjectCard({ project }: { project: ProjectItem })
```

**Why**: Catch errors at compile-time, better IDE support, self-documenting code

#### 5. **State Management Pattern**
```typescript
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

async function fetchData() {
  try {
    setLoading(true);
    const result = await apiCall();
    setData(result);
  } catch (err) {
    setError("Failed to load");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  fetchData();
}, []);

return (
  <>
    {loading && <p>Loading...</p>}
    {error && <p>{error}</p>}
    {data.map(item => <Item key={item.id} item={item} />)}
  </>
);
```

**Why**: Robust loading/error states, clean UI, good UX

### Styling with Tailwind CSS

```typescript
// Utility-first CSS approach
<button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
  Click me
</button>
```

**Why**: Fast development, consistent design, smaller CSS bundles

## 📊 Database Schema Deep Dive

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
)
```
**Purpose**: Authentication, user identification, ownership tracking

### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
)
```
**Purpose**: User's workspace containers, logical grouping

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
)
```
**Purpose**: Store uploaded documents and extracted text

### Document Chunks Table
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id),
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```
**Purpose**: Store split document parts for efficient retrieval

### Evaluation Datasets Table
```sql
CREATE TABLE evaluation_datasets (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
)
```
**Purpose**: Grouping test cases for evaluation

### Test Cases Table
```sql
CREATE TABLE test_cases (
  id UUID PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES evaluation_datasets(id),
  query VARCHAR(255) NOT NULL,
  expected_answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
)
```
**Purpose**: Individual evaluation items

### Batch Evaluation Runs Table
```sql
CREATE TABLE batch_evaluation_runs (
  id UUID PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES evaluation_datasets(id),
  status VARCHAR(50) NOT NULL,
  total_test_cases INTEGER,
  passed_test_cases INTEGER,
  average_overall_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
)
```
**Purpose**: Track evaluation executions and aggregate metrics

### Evaluation Results Table
```sql
CREATE TABLE evaluation_results (
  id UUID PRIMARY KEY,
  batch_run_id UUID NOT NULL REFERENCES batch_evaluation_runs(id),
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  faithfulness_score DECIMAL(5,2),
  relevance_score DECIMAL(5,2),
  correctness_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  passed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
)
```
**Purpose**: Store individual test case evaluation results

## 🎯 Challenges and Solutions

### Challenge 1: Multi-layered Nested Resources
**Problem**: Handling `/projects/{id}/datasets/{datasetId}/batch-runs/{runId}`

**Solution**: 
```python
# Validate ownership at each level
project = get_project(project_id, user)
dataset = get_dataset(dataset_id, project)  # Via project
batch_run = get_batch_run(batch_run_id, dataset)  # Via dataset
```

### Challenge 2: Token Consistency
**Problem**: Token key inconsistency between login and logout

**Solution**: 
```typescript
// Standardize on one key: evalguard_token
// LoginPage.tsx
localStorage.setItem("evalguard_token", token);

// auth.ts
logoutUser() {
  localStorage.removeItem("evalguard_token");
}

// client.ts
const token = localStorage.getItem("evalguard_token");
```

### Challenge 3: Protected Routes Without Duplicating AppLayout
**Problem**: Need authentication guard but avoid nesting AppLayout twice

**Solution**: 
```typescript
// Use ProtectedRoute wrapper
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    // ... other routes
  </Route>
</Route>
```

### Challenge 4: Flexible Response Normalization
**Problem**: API responses might have different field names

**Solution**: 
```typescript
function normalizeRuns(data: any): EvaluationRunItem[] {
  return (
    data.batch_runs ||
    data.evaluation_runs ||
    data.runs ||
    []
  );
}
```

## 📈 What I Learned

### Backend
- FastAPI framework design and best practices
- SQLAlchemy ORM and relationship modeling
- JWT authentication and authorization
- Service layer pattern for code organization
- Alembic for schema migrations
- Pydantic for validation and serialization

### Frontend
- React hooks and state management patterns
- TypeScript for type safety in React
- Protected routes and authentication flow
- Axios interceptors for API clients
- Tailwind CSS for rapid styling
- React Router v7 for nested routing

### Full Stack
- API design with RESTful conventions
- Database relationships and migrations
- Authentication token flow
- Error handling across layers
- CORS configuration
- Environment variable management

## 💬 Common Interview Questions

### Q: How would you scale this to handle millions of evaluations?
**A**: 
- Add caching layer (Redis) for frequently accessed data
- Implement pagination for large result sets
- Use background job queue (Celery) for async evaluations
- Implement database indexing on frequently queried columns
- Consider sharding by project_id
- Add CDN for static frontend assets

### Q: How would you handle concurrent batch evaluations?
**A**:
- Use async/await in Python backend
- Implement queue system for job management
- Add locks to prevent race conditions on dataset updates
- Use connection pooling for database
- Monitor system resources and implement backpressure

### Q: How would you add support for different LLM providers?
**A**:
- Create an interface/abstract class for LLM providers
- Implement adapters for each provider (OpenAI, Anthropic, Ollama)
- Store provider config in database
- Allow users to select provider per project
- Handle different token limits and output formats

### Q: How would you improve error handling?
**A**:
- Add structured logging with correlation IDs
- Implement circuit breaker pattern for external APIs
- Add monitoring/alerting for errors
- Graceful degradation when services fail
- Better user-facing error messages
- Error tracking service (e.g., Sentry)

### Q: How would you add real-time updates?
**A**:
- Implement WebSocket connection for live updates
- Send updates when evaluation completes
- Progress updates during batch runs
- Real-time notifications for long-running tasks
- Consider using Socket.io or Django Channels

## 🔗 Key Resources for Discussion

### Architecture Decisions
- Why FastAPI? (Speed, automatic docs, type hints, async support)
- Why React? (Component-based, large ecosystem, good tooling)
- Why PostgreSQL? (Relational data, strong consistency, JSON support)

### Code Quality
- Type safety with TypeScript and Pydantic
- Clean architecture with layered design
- SOLID principles application
- Testing strategies (unit, integration, E2E)

### DevOps & Deployment
- Docker containerization
- Database migrations strategy
- Environment configuration management
- CORS and security headers

## 📝 Explaining Code Snippets

Be ready to discuss:

1. **Service Layer Implementation**
   - How business logic is isolated
   - How dependencies are injected
   - Error handling patterns

2. **Protected Routes**
   - Authentication flow
   - Token validation
   - Redirect logic

3. **API Client Pattern**
   - Axios interceptors
   - Token injection
   - Error handling

4. **Database Relationships**
   - Foreign keys
   - Cascade operations
   - Query efficiency

## 🎓 Final Tips

- **Own your design decisions**: Be able to explain why you chose specific technologies/patterns
- **Know your code**: Be able to walk through key files and explain logic
- **Think about trade-offs**: What are the pros/cons of your approach?
- **Scale thinking**: How would you improve it with more resources/time?
- **Problem-solving**: Explain how you solved specific challenges
- **Testing mindset**: Discuss how you would test different components
- **User perspective**: Remember the end user experience

## 📞 Interview Talking Points

1. **Introduction**: "I built EvalGuard AI as a full-stack project to evaluate RAG systems..."
2. **Problem**: "The challenge was creating a platform that could batch evaluate multiple test cases..."
3. **Solution**: "I implemented a layered architecture with FastAPI backend and React frontend..."
4. **Technical Highlights**: "Key technical decisions include JWT auth, SQLAlchemy ORM, protected routes..."
5. **Challenges**: "One interesting challenge was handling nested resources and maintaining auth across layers..."
6. **Results**: "The final product allows users to upload documents, create test datasets, and run batch evaluations..."
7. **Learning**: "This project taught me about full-stack architecture, database design, and API conventions..."
