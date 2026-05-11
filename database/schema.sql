CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
    student_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_code TEXT UNIQUE NOT NULL,
    subject_name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS silos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    silo_code TEXT NOT NULL,
    silo_description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    assessment_name TEXT NOT NULL,
    assessment_type TEXT,
    weight REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS student_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    weighted_score REAL,
    feedback_comment TEXT,
    rubric_data TEXT,
    mastery_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competency_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    silo_id INTEGER REFERENCES silos(id) ON DELETE CASCADE,
    competency_score REAL,
    strength_level TEXT,
    gap_level TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    difficulty TEXT,
    generated_questions TEXT,
    generated_answers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    recommendation_type TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
