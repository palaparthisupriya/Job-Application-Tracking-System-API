# Job-Application-Tracking-System-API
This project is a fully functional Applicant Tracking System (ATS) backend built using Node.js, Express, MongoDB, JWT Authentication, and a background email worker using a message queue.
It simulates a real-world hiring workflow:
Candidates apply for jobs
Recruiters review applications
Recruiters update application stages
The system enforces valid stage transitions
Background worker sends async email notifications
Admin can view/manage all entities
This project demonstrates understanding of system design, RBAC, state machines, queues, and clean backend architecture.

## Architecture Overview
The ATS backend is designed using modular, scalable architecture with a clear separation of concerns:

1. Express API Layer
Handles all incoming HTTP requests:
User authentication (JWT)
Job management
Application workflow
Admin operations
Stats and analytics

2. Database Layer (MongoDB + Mongoose)
Stores and manages:
Users
Jobs
Applications
Application history
Mongoose schemas enforce validation, references, and timestamps.

3. RBAC (Role-Based Access Control)
Three roles are supported:
Candidate → can apply to jobs, view their applications
Recruiter → can create jobs, review and update applications
Admin → has full access to all resources
Authorization middleware enforces who can access what.

4. Application State Machine
Every application moves through these strict transitions:

**Applied -> Screening-> Interview -> Offer -> Hired
                      -> Rejected

Invalid transitions are blocked.

5. Background Worker + Message Queue
All emails are sent asynchronously via:
Producer (API server) → adds an email job
Queue → stores pending tasks
Worker process → sends emails in the background
This prevents the API from slowing down during email operations.

## Folder Structure
src/
│── controllers/
│   ├── authcontrollers.js
│   ├── jobcontrollers.js
│   ├── applicationcontroller.js
│   └── admincontrollers.js
│
│── routes/
│   ├── authroutes.js
│   ├── jobroutes.js
│   ├── applicationroutes.js
│   ├── adminroutes.js
│   └── statsroutes.js
│
│── models/
│   ├── user.js
│   ├── job.js
│   ├── applicationmodel.js
│   └── applicationhistory.js
│
│── middleware/
│   ├── authMiddleware.js
│   └── adminmiddleware.js
│
│── workers/
│   └── emailworker.js
│
│── utils/
│   └── queue.js
│
.env
server.js
README.md

##  Role-Based Access Control (RBAC) Matrix

| Endpoint | Candidate | Recruiter | Admin |
|----------|-----------|-----------|--------|
| **Auth** |
| POST /api/auth/register | ✔ | ✔ | ✔ |
| POST /api/auth/login | ✔ | ✔ | ✔ |
| **User** |
| GET /api/users/me | ✔ | ✔ | ✔ |
| PUT /api/users/me | ✔ | ✔ | ✔ |
| **Jobs** |
| GET /api/jobs | ✔ | ✔ | ✔ |
| POST /api/jobs | ✖ | ✔ | ✔ |
| PUT /api/jobs/:jobId | ✖ | ✔ | ✔ |
| DELETE /api/jobs/:jobId | ✖ | ✔ | ✔ |
| **Applications** |
| POST /api/applications | ✔ | ✖ | ✔ |
| GET /api/applications/my | ✔ | ✖ | ✔ |
| GET /api/applications/job/:jobId | ✖ | ✔ | ✔ |
| PUT /api/applications/:id/status | ✖ | ✔ | ✔ |
| **Admin** |
| GET /api/admin/users | ✖ | ✖ | ✔ |
| PUT /api/admin/users/update-role | ✖ | ✖ | ✔ |
| DELETE /api/admin/users/:userId | ✖ | ✖ | ✔ |
| GET /api/admin/jobs | ✖ | ✖ | ✔ |
| DELETE /api/admin/jobs/:jobId | ✖ | ✖ | ✔ |
| GET /api/admin/applications | ✖ | ✖ | ✔ |
| DELETE /api/admin/applications/:appId | ✖ | ✖ | ✔ |

## Setup & Run Instructions
1. Clone the Repository
git clone 
cd ats-backend
2. Install Dependencies
npm install
3. Configure Environment Variables
Create a .env file in the project root:
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret_key>
EMAIL_SERVICE=<your_email_service_provider>  # e.g., gmail
EMAIL_USER=<your_email_address>
EMAIL_PASS=<your_email_password_or_app_specific_password>
REDIS_URL=<your_redis_connection_string> # for background worker

Notes:
MONGO_URI: MongoDB connection string (Atlas or local).
JWT_SECRET: Secret key for JWT token signing.
EMAIL_*: Credentials for sending asynchronous notifications.
REDIS_URL:Redis server connection string for background worker queue.
4. Run MongoDB (if using local)
mongod
5. Start Background Worker
Open a new terminal:
node workers/emailworker.js
This handles asynchronous email notifications.
6. Start the API Server
npm run dev
Server runs on http://localhost:5000 (or the port in .env).
7. Test API Endpoints
Use Postman (collection included in repo).
Key endpoints:
POST /api/auth/register — Register user
POST /api/auth/login — Login
POST /api/jobs — Create job (recruiter/admin)
POST /api/applications — Submit application (candidate)
PUT /api/applications/:id/status — Change application stage (recruiter/admin)

