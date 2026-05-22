# Learning Journey Assistant - Latrobe Plus

An AI-powered personalised student learning platform for La Trobe University, designed to analyse student assessment data, predict academic risks, and generate adaptive quizzes and study recommendations.

## Project Structure
This is a full-stack monorepo consisting of:
- `frontend/` - React (Vite) + Tailwind CSS + Framer Motion
- `backend/` - Node.js + Express + SQLite
- `database/` - SQLite database file and schema

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

---

## 🚀 How to Run the Project Locally

You will need to open **two separate terminal windows**—one for the backend and one for the frontend.

### 1. Start the Backend

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

Ensure your packages are installed:
```bash
npm install
```

Start the backend development server:
```bash
npm run dev
```
*The server will start running at `http://localhost:5000`.*

### 2. Start the Frontend

Open a **new** terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Ensure your packages are installed:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
*The Vite development server will start, typically at `http://localhost:5173`. Open this URL in your browser.*

---

## 🔐 Demo Accounts

The database has already been seeded with demo accounts. You can log in using any of the following credentials:

**Student Account:**
- Email: `student@latrobe.edu`
- Password: `Student123`

**Lecturer Account:**
- Email: `lecturer@latrobe.edu`
- Password: `Lecturer123`

**Admin Account:**
- Email: `admin@latrobe.edu`
- Password: `Admin123`

---

## 🛠️ Resetting the Database
If you ever need to reset your database back to its initial state with just the demo accounts, you can re-run the seed script.

In the `backend` directory, run:
```bash
npm run build
node dist/seed.js
```
