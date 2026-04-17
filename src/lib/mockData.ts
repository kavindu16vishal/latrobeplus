export interface LearningOutcome {
  id: string;
  title: string;
  description: string;
  mastery: number; // 0-100
  status: "strong" | "developing" | "gap";
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: string;
  overallMastery: number;
  outcomes: LearningOutcome[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  outcomeId: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface StudyStrategy {
  id: string;
  title: string;
  description: string;
  category: "revision" | "practice" | "conceptual" | "metacognitive";
  priority: "high" | "medium" | "low";
  relatedOutcomes: string[];
}

export interface LearningPlan {
  id: string;
  weekNumber: number;
  tasks: { title: string; completed: boolean; type: string }[];
}

export const mockSubjects: Subject[] = [
  {
    id: "s1",
    code: "CSE3CAP",
    name: "Cloud Application Development",
    semester: "Semester 1, 2026",
    overallMastery: 68,
    outcomes: [
      { id: "lo1", title: "Cloud Architecture Design", description: "Design scalable cloud-native application architectures using microservices patterns", mastery: 82, status: "strong" },
      { id: "lo2", title: "Container Orchestration", description: "Deploy and manage containerised applications using Kubernetes", mastery: 45, status: "gap" },
      { id: "lo3", title: "CI/CD Pipelines", description: "Implement continuous integration and delivery pipelines", mastery: 71, status: "developing" },
      { id: "lo4", title: "Cloud Security", description: "Apply security best practices in cloud environments", mastery: 58, status: "developing" },
      { id: "lo5", title: "Serverless Computing", description: "Develop event-driven serverless applications", mastery: 75, status: "strong" },
    ],
  },
  {
    id: "s2",
    code: "CSE3DBF",
    name: "Database Fundamentals",
    semester: "Semester 1, 2026",
    overallMastery: 74,
    outcomes: [
      { id: "lo6", title: "Relational Modelling", description: "Design normalised relational database schemas", mastery: 88, status: "strong" },
      { id: "lo7", title: "SQL Proficiency", description: "Write complex SQL queries including joins, subqueries, and aggregations", mastery: 79, status: "strong" },
      { id: "lo8", title: "Transaction Management", description: "Implement ACID-compliant transaction management", mastery: 52, status: "gap" },
      { id: "lo9", title: "NoSQL Databases", description: "Evaluate and apply NoSQL solutions for appropriate use cases", mastery: 65, status: "developing" },
    ],
  },
  {
    id: "s3",
    code: "CSE3SOA",
    name: "Software Architecture",
    semester: "Semester 1, 2026",
    overallMastery: 61,
    outcomes: [
      { id: "lo10", title: "Design Patterns", description: "Apply GoF design patterns to solve recurring design problems", mastery: 70, status: "developing" },
      { id: "lo11", title: "Architecture Styles", description: "Compare and select appropriate architectural styles", mastery: 55, status: "developing" },
      { id: "lo12", title: "Quality Attributes", description: "Evaluate trade-offs between quality attributes in design decisions", mastery: 48, status: "gap" },
      { id: "lo13", title: "Documentation", description: "Create architecture documentation using standard views and notations", mastery: 72, status: "strong" },
    ],
  },
];

export const mockQuizQuestions: QuizQuestion[] = [
  { id: "q1", question: "Which Kubernetes object is used to ensure a specified number of pod replicas are running?", options: ["Service", "ReplicaSet", "ConfigMap", "Ingress"], correctIndex: 1, outcomeId: "lo2", difficulty: "medium" },
  { id: "q2", question: "What does the 'I' in ACID stand for?", options: ["Integrity", "Isolation", "Independence", "Indexing"], correctIndex: 1, outcomeId: "lo8", difficulty: "easy" },
  { id: "q3", question: "Which architectural quality attribute describes a system's ability to handle increased load?", options: ["Maintainability", "Scalability", "Reliability", "Testability"], correctIndex: 1, outcomeId: "lo12", difficulty: "easy" },
  { id: "q4", question: "In Kubernetes, what is a Pod?", options: ["A virtual machine", "The smallest deployable unit", "A network policy", "A storage volume"], correctIndex: 1, outcomeId: "lo2", difficulty: "easy" },
  { id: "q5", question: "Which isolation level prevents dirty reads but allows non-repeatable reads?", options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"], correctIndex: 1, outcomeId: "lo8", difficulty: "hard" },
];

export const mockStrategies: StudyStrategy[] = [
  { id: "st1", title: "Hands-on Kubernetes Labs", description: "Complete interactive Kubernetes tutorials using Minikube to build practical container orchestration skills.", category: "practice", priority: "high", relatedOutcomes: ["lo2"] },
  { id: "st2", title: "Transaction Scenario Analysis", description: "Work through concurrency control scenarios to understand isolation levels and locking mechanisms.", category: "conceptual", priority: "high", relatedOutcomes: ["lo8"] },
  { id: "st3", title: "Architecture Trade-off Worksheets", description: "Practice evaluating quality attribute trade-offs using ATAM scenarios from past lectures.", category: "practice", priority: "high", relatedOutcomes: ["lo12"] },
  { id: "st4", title: "Spaced Repetition for Cloud Security", description: "Use flashcard-based spaced repetition to reinforce cloud security concepts and best practices.", category: "revision", priority: "medium", relatedOutcomes: ["lo4"] },
  { id: "st5", title: "Self-Reflection Journal", description: "After each study session, write a brief reflection on what you learned and what remains unclear.", category: "metacognitive", priority: "medium", relatedOutcomes: ["lo2", "lo8", "lo12"] },
];

export const mockLearningPlan: LearningPlan[] = [
  { id: "w1", weekNumber: 1, tasks: [
    { title: "Complete Kubernetes basics tutorial", completed: true, type: "practice" },
    { title: "Review ACID properties lecture notes", completed: true, type: "revision" },
    { title: "Attempt adaptive quiz on containers", completed: false, type: "quiz" },
  ]},
  { id: "w2", weekNumber: 2, tasks: [
    { title: "Deploy multi-container app with Docker Compose", completed: false, type: "practice" },
    { title: "Study transaction isolation levels", completed: false, type: "conceptual" },
    { title: "Architecture trade-off analysis exercise", completed: false, type: "practice" },
  ]},
  { id: "w3", weekNumber: 3, tasks: [
    { title: "Kubernetes networking deep dive", completed: false, type: "conceptual" },
    { title: "Practice SQL transaction scenarios", completed: false, type: "practice" },
    { title: "Self-reflection on progress", completed: false, type: "metacognitive" },
  ]},
];

export const studentProfile = {
  name: "Alex Chen",
  studentId: "21456789",
  course: "Bachelor of Computer Science",
  year: 3,
  overallMastery: 67,
  strengths: ["Relational Modelling", "Cloud Architecture Design", "SQL Proficiency"],
  gaps: ["Container Orchestration", "Transaction Management", "Quality Attributes"],
};
