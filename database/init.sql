CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
    student_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE silos (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    silo_code VARCHAR(50) NOT NULL,
    silo_description TEXT NOT NULL
);

CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(100),
    weight DECIMAL(5,2) NOT NULL
);

CREATE TABLE student_results (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INT REFERENCES assessments(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    weighted_score DECIMAL(5,2),
    feedback_comment TEXT,
    rubric_data JSONB,
    mastery_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE competency_profiles (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    silo_id INT REFERENCES silos(id) ON DELETE CASCADE,
    competency_score DECIMAL(5,2),
    strength_level VARCHAR(50),
    gap_level VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50),
    generated_questions JSONB,
    generated_answers JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    recommendation_type VARCHAR(100),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
