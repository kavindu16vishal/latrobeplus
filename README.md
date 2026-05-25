# Learning Journey Assistant

> An AI-powered personalised learning platform for La Trobe University — built to analyse student assessment data, predict academic risk, and deliver adaptive study tools powered by OpenAI GPT-4o mini.

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38bdf8?logo=tailwindcss&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-green)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features by Role](#features-by-role)
  - [Student Portal](#-student-portal)
  - [Lecturer Portal](#-lecturer-portal)
  - [Admin God Mode](#-admin-god-mode)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Demo Accounts](#demo-accounts)
- [API Overview](#api-overview)
- [Database Reset](#database-reset)

---

## Overview

Learning Journey Assistant is a full-stack academic platform with three distinct role portals. Students get an AI-driven suite of study tools and progress visualisations. Lecturers can manage results and monitor at-risk students. Administrators have complete control over users, subjects, and data.

All AI features include graceful fallbacks when no OpenAI API key is configured, making the platform fully usable in demo environments without a paid key.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8.0 | Build tool & dev server |
| Tailwind CSS | 4.3 | Utility-first styling |
| Framer Motion | 12 | Animations & transitions |
| Recharts | 3.8 | Charts & data visualisation |
| React Router DOM | 7 | Client-side routing |
| Axios | 1.16 | HTTP client |
| Lucide React | 1.14 | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.2 | HTTP framework |
| TypeScript | 6.0 | Type safety |
| SQLite + sqlite3 | 5/6 | Embedded database |
| JSON Web Token | 9.0 | Stateless authentication |
| bcryptjs | 3.0 | Password hashing |
| OpenAI SDK | 6.37 | GPT-4o mini integration |
| Multer | 2.1 | File upload handling |
| XLSX | 0.18 | Excel / CSV parsing |

---

## Features by Role

### 🎓 Student Portal

#### Dashboard
- **WAM Summary** — weighted average mark across all enrolled subjects with grade classification (HD / D / C / P / N)
- **Study Streak** — consecutive active days tracked with longest streak record
- **Peer Benchmark** — per-subject comparison of your score against the cohort average with percentile ranking
- **Real-time Notifications** — unread badge with 30-second polling; instant mark-as-read

#### AI-Powered Study Tools
| Feature | Description |
|---|---|
| **AI Insights** | Personalised performance analysis with subject-level strengths/weaknesses and actionable recommendations |
| **AI Learning Tutor** | Conversational Q&A tutor powered by GPT-4o mini; context-aware answers scoped to enrolled subjects |
| **Exam Prep Coach** | Enter a subject and exam date → generates a day-by-day study schedule, key topic chips, expandable practice questions with model answers, and exam-day tips |
| **Assignment Feedback** | Paste a draft → AI returns structured feedback: overall rating, estimated grade, strengths, section-by-section improvements, and next steps |
| **Adaptive Quizzes** | AI-generated multiple-choice quizzes with instant scoring, answer explanations, and performance history |
| **Flashcards** | AI-generated flashcard decks per subject with flip animations and a spaced-repetition drill mode |
| **Study Planner** | Generates a personalised weekly study plan based on enrolled subjects, scheduled around upcoming assessments |
| **My Notes** | Rich note editor with subject tagging, full CRUD, and one-click AI summarisation of any note |

#### Progress Tools
| Feature | Description |
|---|---|
| **Grade Calculator** | What-if WAM predictor — enter hypothetical scores for upcoming assessments to see projected final WAM |
| **Competency Map** | Radar chart visualising mastery levels across subjects and learning outcomes |
| **Assessment Calendar** | Visual calendar of all upcoming assessment deadlines with overdue alerts and colour-coded urgency |

---

### 📋 Lecturer Portal

#### Subject Overview Dashboard
- Class average WAM across all enrolled students
- Total student count with at-risk / attention-needed / on-track breakdown
- Grade distribution bar chart (HD, D, C, P, Fail)
- Risk breakdown doughnut chart
- Per-subject average score rankings
- Bottom 10 at-risk students table with their weakest subject

#### All Students
- Searchable, sortable, filterable student table (by name, ID, WAM, status)
- One-click **Student Profile Slide-over** showing:
  - WAM and risk status badge
  - Per-subject performance bars
  - Competency radar chart
  - Progress trend line chart (10-week history or generated from WAM)
  - AI-generated recommendation
  - **Contact Student** (mailto link)
  - **Send Notification** — inline compose form (title + message) that delivers an in-app notification directly to the student

#### Results Management
- Subject and assessment selector with enrolled count and average score
- Inline grade entry table for every student:
  - Score input (0–100) with real-time grade label (HD / D / C / P / N) in colour
  - Feedback comment field
  - Blue highlight on unsaved changes (dirty-state tracking)
  - Save button (POST for new results, PUT for existing) per row
  - Delete button when a result exists
- Completion progress bar showing entered / total results
- Student name and ID search filter

#### Notifications
- View all received in-app notifications with unread highlighting
- **Notify At-Risk Students** — compose a bulk message sent instantly to all students with WAM < 65% in the lecturer's assigned subjects; shows count of recipients on success

#### At-Risk Alerts
- Red shield alert in sidebar and header when students are at risk
- At-risk count badge on the navigation item

---

### 🛡️ Admin God Mode

#### System Overview
- Live platform metrics: total users, registered students, subjects, assessments
- Database file size and last-modified timestamp
- API request and response health check
- Scrollable audit log of all admin actions (user creation, deletions, data uploads)
- System health indicators

#### User Management
- Full CRUD on all user accounts (students, lecturers, admins)
- Create users with role assignment
- Edit names, emails, and passwords
- Delete accounts with confirmation guard

#### Lecturer Management
- Create lecturer accounts with immediate login access
- Assign and unassign subjects to lecturers via subject chips
- View each lecturer's assigned subjects, student count, and average score

#### Subject Management
- Create, edit, and delete subjects (subject code + name)
- Manage assessments per subject: name, type, weight, due date
- Subject-level enrolment and average score summary

#### Results Management (Admin)
- Admin-scope view of all subjects and all students
- Same inline grade entry interface as the lecturer portal but with unrestricted access across all subjects

#### Student Monitor
- Identical analytics dashboard to the lecturer overview (class WAM, grade distribution, risk breakdown, subject averages, at-risk list with weakest subject)

#### Data Upload
- Bulk import students from CSV or Excel (`.xlsx`) files
- Bulk import assessment results from CSV or Excel
- File validation with row-level error reporting

#### Notifications (Admin)
- Compose and broadcast notifications to any target group: Everyone, All Students, All Lecturers, All Admins
- View own notification inbox

---

## Project Structure

```
LearningJourneyAssistant/
├── frontend/                  # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   │   └── DashboardLayout.tsx   # Sidebar nav, header, role-based routing
│       │   ├── AIChatbot.tsx             # Floating AI chat widget (student only)
│       │   └── StudentSlideOver.tsx      # Slide-over student profile panel
│       ├── context/
│       │   └── AuthContext.tsx           # JWT auth state & token management
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── StudentDashboard.tsx
│       │   ├── AIInsights.tsx
│       │   ├── AITutor.tsx
│       │   ├── Quizzes.tsx
│       │   ├── Flashcards.tsx
│       │   ├── ExamPrepCoach.tsx
│       │   ├── AssignmentFeedback.tsx
│       │   ├── GradeCalculator.tsx
│       │   ├── CompetencyMap.tsx
│       │   ├── AssessmentCalendar.tsx
│       │   ├── StudyPlanner.tsx
│       │   ├── StudentNotes.tsx
│       │   ├── LecturerDashboard.tsx
│       │   ├── LecturerStudents.tsx
│       │   ├── LecturerResults.tsx
│       │   ├── Notifications.tsx
│       │   ├── AdminDashboard.tsx
│       │   ├── SystemDashboard.tsx
│       │   ├── UserManagement.tsx
│       │   ├── LecturerManagement.tsx
│       │   ├── SubjectManagement.tsx
│       │   ├── ResultsManagement.tsx
│       │   └── DataManagement.tsx
│       └── App.tsx                       # Route definitions with role guards
│
├── backend/                   # Express + TypeScript API
│   └── src/
│       ├── db.ts                         # SQLite connection & query helper
│       ├── server.ts                     # App entry point & route registration
│       ├── middleware/
│       │   └── auth.ts                   # JWT verification & role guard middleware
│       └── routes/
│           ├── auth.ts                   # Login, registration
│           ├── student.ts                # Student results, subjects
│           ├── student-features.ts       # All 10 AI feature endpoints
│           ├── insights.ts               # AI insights generation
│           ├── quizzes.ts                # Adaptive quiz generation
│           ├── chat.ts                   # AI tutor chat
│           ├── lecturer.ts               # Lecturer results CRUD & notifications
│           ├── admin.ts                  # Admin CRUD, analytics, audit log
│           ├── notifications.ts          # In-app notification system
│           └── upload.ts                 # CSV/XLSX bulk import
│
└── database/
    └── database.sqlite                   # SQLite database file
```

---

## Getting Started

You need **two terminal windows** — one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The API server starts at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at **http://localhost:5173** — open this in your browser.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Required for JWT signing — use any long random string
JWT_SECRET=your_super_secret_key_here

# Optional — AI features work without this key using deterministic fallbacks
OPENAI_API_KEY=sk-...
```

If `OPENAI_API_KEY` is not set, all AI endpoints return pre-built structured responses so the platform is fully functional without an OpenAI account.

---

## Demo Accounts

The database is pre-seeded with three demo accounts:

| Role | Email | Password |
|---|---|---|
| Student | `student@latrobe.edu` | `Student123` |
| Lecturer | `lecturer@latrobe.edu` | `Lecturer123` |
| Admin | `admin@latrobe.edu` | `Admin123` |

---

## API Overview

All routes are prefixed with `/api`.

| Prefix | Auth Required | Roles | Description |
|---|---|---|---|
| `/api/auth` | No | — | Login, register |
| `/api/student` | Yes | student | Results, subjects, calendar |
| `/api/student-features` | Yes | student | AI tools (insights, planner, notes, flashcards, etc.) |
| `/api/insights` | Yes | student | AI performance insights |
| `/api/quizzes` | Yes | student | Adaptive quiz generation & history |
| `/api/chat` | Yes | student | AI tutor conversation |
| `/api/lecturer` | Yes | lecturer, admin | Results CRUD, subject lists, notifications |
| `/api/admin` | Yes | admin | Full user/subject/results management, audit log |
| `/api/notifications` | Yes | all | In-app notification inbox, mark-read, bulk send |
| `/api/upload` | Yes | admin | CSV/XLSX bulk import |

Authentication uses **JWT Bearer tokens**. Include `Authorization: Bearer <token>` on all protected routes.

---

## Database Reset

To restore the database to its initial seeded state:

```bash
cd backend
npm run build
node dist/seed.js
```

This drops and recreates all tables, re-inserts demo accounts, sample subjects, assessments, and student results.

---

## Architecture Notes

- **Role-Based Access Control** — three roles enforced at both the API middleware layer and React route guards. A student cannot hit lecturer or admin endpoints; the frontend redirects to `/unauthorized` if a protected route is accessed directly.
- **JWT Stateless Auth** — tokens are stored in `localStorage` and attached to every API request via Axios. The backend verifies the token signature and role on every protected route.
- **OpenAI Fallback** — every AI endpoint checks `process.env.OPENAI_API_KEY` at runtime. If absent, it returns a deterministically generated response using the same interface shape, ensuring the UI always renders correctly.
- **SQLite WAL Mode** — the database runs in Write-Ahead Logging mode for improved concurrent read performance.
- **Strict TypeScript** — both projects use `strict: true`, `noUnusedLocals: true`, and `noUnusedParameters: true`. Zero TypeScript errors required to build.
