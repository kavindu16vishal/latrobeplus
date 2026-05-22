import express from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

// List all quizzes for the logged-in student
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const quizzes = await query(`
      SELECT
        q.id,
        q.topic,
        q.difficulty,
        q.created_at,
        qa.score as attempt_score,
        qa.completed_at
      FROM quizzes q
      LEFT JOIN (
        SELECT quiz_id, student_id, score, completed_at
        FROM quiz_attempts
        WHERE id IN (
          SELECT MAX(id) FROM quiz_attempts GROUP BY quiz_id, student_id
        )
      ) qa ON qa.quiz_id = q.id AND qa.student_id = q.student_id
      WHERE q.student_id = ?
      ORDER BY q.created_at DESC
    `, [userId]);

    res.json(quizzes.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get recommended quiz topics based on student's weakest subjects
router.get('/recommended', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const weakSubjects = await query(`
      SELECT s.subject_code as subject, AVG(sr.score) as score
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
      GROUP BY s.subject_code
      HAVING AVG(sr.score) < 70
      ORDER BY score ASC
      LIMIT 3
    `, [userId]);

    res.json(weakSubjects.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Get a single quiz with its questions
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const quiz = await query(
      `SELECT * FROM quizzes WHERE id = ? AND student_id = ?`,
      [id, userId]
    );

    if (quiz.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const q = quiz.rows[0];
    const attempt = await query(
      `SELECT score, completed_at FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY completed_at DESC LIMIT 1`,
      [id, userId]
    );

    res.json({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      createdAt: q.created_at,
      questions: JSON.parse(q.generated_questions || '[]'),
      attempt: attempt.rows[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Generate a new AI quiz for a given topic
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { topic, difficulty = 'Adaptive' } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Get student's current score in this area for difficulty calibration
    const perfResult = await query(`
      SELECT AVG(sr.score) as score
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ? AND (s.subject_code LIKE ? OR s.subject_name LIKE ?)
    `, [userId, `%${topic}%`, `%${topic}%`]);

    const studentScore = perfResult.rows[0]?.score ?? 50;

    // Demo quiz when no real API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      const demoQuestions = getDemoQuestions(topic);

      const result = await query(
        `INSERT INTO quizzes (student_id, topic, difficulty, generated_questions, generated_answers) VALUES (?, ?, ?, ?, ?)`,
        [userId, topic, difficulty, JSON.stringify(demoQuestions), JSON.stringify(demoQuestions.map((q: any) => q.correctIndex))]
      );

      return res.json({ id: result.lastID, topic, difficulty, questions: demoQuestions });
    }

    // AI-generated quiz
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const difficultyGuide = studentScore < 50 ? 'beginner/foundational' : studentScore < 70 ? 'intermediate' : 'advanced';

    const prompt = `Generate a 10-question multiple choice quiz for a La Trobe University student.

Topic: "${topic}"
Student's current score in this area: ${Number(studentScore).toFixed(1)}%
Calibrated difficulty: ${difficultyGuide}

Respond ONLY with this JSON (no extra text):
{
  "questions": [
    {
      "question": "question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": <0-3>,
      "explanation": "brief explanation of the correct answer"
    }
  ]
}

Rules:
- All 10 questions must be strictly about "${topic}"
- Mix conceptual understanding and application questions
- Calibrate to ${difficultyGuide} level
- Explanations must be educational and concise (1-2 sentences)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{"questions":[]}');
    const questions = parsed.questions || [];

    const result = await query(
      `INSERT INTO quizzes (student_id, topic, difficulty, generated_questions, generated_answers) VALUES (?, ?, ?, ?, ?)`,
      [userId, topic, difficulty, JSON.stringify(questions), JSON.stringify(questions.map((q: any) => q.correctIndex))]
    );

    res.json({ id: result.lastID, topic, difficulty, questions });

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit a completed quiz attempt
router.post('/:id/submit', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { answers } = req.body; // array of selected option indices

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array' });
    }

    const quiz = await query(
      `SELECT * FROM quizzes WHERE id = ? AND student_id = ?`,
      [id, userId]
    );

    if (quiz.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = JSON.parse(quiz.rows[0].generated_questions || '[]');

    let correct = 0;
    const results = questions.map((q: any, idx: number) => {
      const isCorrect = answers[idx] === q.correctIndex;
      if (isCorrect) correct++;
      return {
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex: answers[idx],
        explanation: q.explanation,
        isCorrect
      };
    });

    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;

    await query(
      `INSERT INTO quiz_attempts (student_id, quiz_id, score, answers) VALUES (?, ?, ?, ?)`,
      [userId, id, score, JSON.stringify(answers)]
    );

    res.json({
      score: Number(score.toFixed(1)),
      correct,
      total: questions.length,
      results
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

type DemoQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };

const DEMO_BANKS: Record<string, DemoQuestion[]> = {
  databases: [
    { question: 'In SQL, which clause is used to filter results after a GROUP BY?', options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'], correctIndex: 1, explanation: 'HAVING filters aggregated results, whereas WHERE filters rows before grouping.' },
    { question: 'What does a PRIMARY KEY constraint enforce?', options: ['Referential integrity', 'Unique non-null values per row', 'Sorted row order', 'Encrypted storage'], correctIndex: 1, explanation: 'A primary key uniquely identifies each record and cannot be NULL.' },
    { question: 'Which SQL JOIN returns only rows that match in both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'], correctIndex: 2, explanation: 'INNER JOIN returns only the intersection — rows with matching values in both tables.' },
    { question: 'What is normalisation in database design?', options: ['Encrypting sensitive columns', 'Organising tables to reduce redundancy', 'Indexing every column', 'Scaling numeric values to 0–1'], correctIndex: 1, explanation: 'Normalisation removes redundant data and improves data integrity.' },
    { question: 'Which normal form eliminates transitive functional dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctIndex: 2, explanation: '3NF ensures non-key attributes depend only on the primary key, not on other non-key attributes.' },
    { question: 'A FOREIGN KEY constraint enforces what kind of integrity?', options: ['Entity integrity', 'Referential integrity', 'Domain integrity', 'User-defined integrity'], correctIndex: 1, explanation: 'A foreign key ensures values in one table exist as primary keys in another table.' },
    { question: 'Which SQL statement removes all rows from a table without logging individual row deletions?', options: ['DELETE', 'DROP', 'TRUNCATE', 'REMOVE'], correctIndex: 2, explanation: 'TRUNCATE removes all rows quickly without logging each deletion, unlike DELETE.' },
    { question: 'What is an index used for in a relational database?', options: ['Defining relationships', 'Speeding up query lookups', 'Enforcing uniqueness only', 'Storing backups'], correctIndex: 1, explanation: 'Indexes create data structures that allow the database to find rows faster without full table scans.' },
    { question: 'In an ER diagram, a diamond shape represents what?', options: ['An entity', 'A relationship', 'An attribute', 'A primary key'], correctIndex: 1, explanation: 'Diamonds represent relationships between entities in an Entity-Relationship diagram.' },
    { question: 'Which SQL aggregate function counts all rows including NULLs?', options: ['COUNT(column)', 'COUNT(*)', 'SUM(*)', 'AVG(*)'], correctIndex: 1, explanation: 'COUNT(*) counts every row in the result set; COUNT(column) skips NULLs in that column.' },
  ],
  algorithms: [
    { question: 'What is the time complexity of Binary Search on a sorted array?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctIndex: 1, explanation: 'Binary Search halves the search space each step, giving O(log n) worst-case time.' },
    { question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort O(n²)', 'Merge Sort O(n log n)', 'Insertion Sort O(n²)', 'Selection Sort O(n²)'], correctIndex: 1, explanation: 'Merge Sort guarantees O(n log n) in all cases by dividing and merging sub-arrays.' },
    { question: 'What data structure does Depth-First Search (DFS) use internally?', options: ['Queue', 'Stack', 'Heap', 'Hash Table'], correctIndex: 1, explanation: 'DFS uses a stack (or the call stack via recursion) to track nodes to visit.' },
    { question: 'What is the space complexity of an in-place sorting algorithm?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctIndex: 2, explanation: 'In-place algorithms use a constant amount of extra memory regardless of input size.' },
    { question: 'In a min-heap, the root node contains which value?', options: ['The maximum value', 'The median value', 'The minimum value', 'An arbitrary value'], correctIndex: 2, explanation: 'A min-heap ensures the root is always the smallest element.' },
    { question: 'Which algorithm finds the shortest path in an unweighted graph?', options: ['Depth-First Search', 'Breadth-First Search', 'Dijkstra\'s', 'Bellman-Ford'], correctIndex: 1, explanation: 'BFS explores level by level, guaranteeing the shortest path in terms of edge count.' },
    { question: 'What is dynamic programming primarily used to solve?', options: ['Sorting problems', 'Problems with overlapping subproblems', 'Graph traversal only', 'String matching only'], correctIndex: 1, explanation: 'Dynamic programming stores solutions to overlapping subproblems to avoid redundant computation.' },
    { question: 'What is the worst-case time complexity of Quick Sort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctIndex: 2, explanation: 'Quick Sort degrades to O(n²) when the pivot is always the smallest or largest element.' },
    { question: 'A hash table provides which average-case lookup complexity?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctIndex: 2, explanation: 'Hash tables use a hash function to map keys to indices, achieving O(1) average lookup.' },
    { question: 'Which traversal of a Binary Search Tree produces sorted output?', options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'], correctIndex: 2, explanation: 'In-order traversal (left → root → right) of a BST visits nodes in ascending sorted order.' },
  ],
  oop: [
    { question: 'Which OOP principle hides internal implementation details?', options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'], correctIndex: 2, explanation: 'Encapsulation bundles data and methods, exposing only a public interface.' },
    { question: 'What does method overriding allow a subclass to do?', options: ['Call a parent method', 'Provide its own implementation of an inherited method', 'Overload operators', 'Create static methods'], correctIndex: 1, explanation: 'Overriding lets a subclass supply a specific implementation for a method defined in the parent class.' },
    { question: 'Which keyword prevents a class from being subclassed in Java?', options: ['static', 'abstract', 'final', 'private'], correctIndex: 2, explanation: 'Declaring a class as final prevents other classes from extending it.' },
    { question: 'What is an abstract class?', options: ['A class with no methods', 'A class that cannot be instantiated directly', 'A class with only static methods', 'A sealed class'], correctIndex: 1, explanation: 'An abstract class defines a template with abstract methods that subclasses must implement.' },
    { question: 'What is the relationship between a Car class and a Vehicle class if Car extends Vehicle?', options: ['Has-a relationship', 'Is-a relationship', 'Uses-a relationship', 'Depends-on relationship'], correctIndex: 1, explanation: 'Inheritance represents an "is-a" relationship — a Car is a Vehicle.' },
    { question: 'Which principle states that a subclass should be substitutable for its parent?', options: ['Open/Closed Principle', 'Liskov Substitution Principle', 'Dependency Inversion', 'Interface Segregation'], correctIndex: 1, explanation: 'The Liskov Substitution Principle ensures subclasses can replace parent classes without breaking code.' },
    { question: 'What is method overloading?', options: ['Redefining a parent method', 'Multiple methods with the same name but different parameters', 'Using a method from an interface', 'Calling super() in a constructor'], correctIndex: 1, explanation: 'Overloading allows the same method name to handle different argument types or counts.' },
    { question: 'In OOP, what is a constructor used for?', options: ['Destroying objects', 'Initialising a newly created object', 'Overriding methods', 'Defining interfaces'], correctIndex: 1, explanation: 'A constructor is called when an object is created and sets up its initial state.' },
    { question: 'What does the "super" keyword refer to in a subclass?', options: ['The subclass itself', 'The parent class', 'A sibling class', 'An interface'], correctIndex: 1, explanation: 'super refers to the immediate parent class and can be used to call its constructors or methods.' },
    { question: 'What is an interface in OOP?', options: ['A concrete class', 'A contract defining method signatures without implementation', 'A class with private methods only', 'A singleton object'], correctIndex: 1, explanation: 'An interface declares method signatures that implementing classes must provide.' },
  ],
  networking: [
    { question: 'Which layer of the OSI model handles end-to-end communication?', options: ['Network layer', 'Transport layer', 'Data Link layer', 'Application layer'], correctIndex: 1, explanation: 'The Transport layer (Layer 4) manages end-to-end data transfer using protocols like TCP and UDP.' },
    { question: 'What does DNS stand for?', options: ['Dynamic Network Service', 'Domain Name System', 'Data Node Server', 'Distributed Name Service'], correctIndex: 1, explanation: 'DNS translates human-readable domain names (e.g. google.com) into IP addresses.' },
    { question: 'Which protocol guarantees reliable, ordered delivery?', options: ['UDP', 'ICMP', 'TCP', 'ARP'], correctIndex: 2, explanation: 'TCP uses acknowledgements, sequencing, and retransmission to ensure reliable delivery.' },
    { question: 'What is the purpose of a subnet mask?', options: ['Encrypting network traffic', 'Dividing an IP address into network and host parts', 'Translating domain names', 'Assigning MAC addresses'], correctIndex: 1, explanation: 'A subnet mask separates the network portion of an IP address from the host portion.' },
    { question: 'Which HTTP status code indicates a resource was not found?', options: ['200', '301', '403', '404'], correctIndex: 3, explanation: 'A 404 status means the server could not find the requested resource.' },
    { question: 'What does HTTPS add over HTTP?', options: ['Faster transmission', 'Compression', 'TLS encryption', 'Caching'], correctIndex: 2, explanation: 'HTTPS wraps HTTP in TLS, encrypting data in transit to prevent eavesdropping.' },
    { question: 'Which protocol assigns IP addresses dynamically?', options: ['FTP', 'DHCP', 'SNMP', 'SMTP'], correctIndex: 1, explanation: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices on a network.' },
    { question: 'What is a MAC address?', options: ['A software-defined network identifier', 'A physical hardware address for a network interface', 'An IP address alias', 'A domain name'], correctIndex: 1, explanation: 'A MAC address is a unique hardware identifier burned into a network interface card.' },
    { question: 'Which port does HTTPS use by default?', options: ['80', '8080', '443', '22'], correctIndex: 2, explanation: 'HTTPS uses TCP port 443 by default; HTTP uses port 80.' },
    { question: 'What is the function of a router?', options: ['Connecting devices within a LAN', 'Forwarding packets between different networks', 'Amplifying Wi-Fi signals', 'Assigning MAC addresses'], correctIndex: 1, explanation: 'Routers forward packets based on IP addresses, connecting different networks together.' },
  ],
  general: [
    { question: 'Which data structure uses LIFO (Last In, First Out) ordering?', options: ['Queue', 'Stack', 'Linked List', 'Hash Map'], correctIndex: 1, explanation: 'A Stack is LIFO — the last element pushed is the first popped.' },
    { question: 'What does an operating system kernel primarily manage?', options: ['User interface rendering', 'Hardware resources and process scheduling', 'Web server requests', 'Database queries'], correctIndex: 1, explanation: 'The kernel manages CPU, memory, I/O devices, and process scheduling.' },
    { question: 'What is version control used for?', options: ['Compressing files', 'Tracking changes to code over time', 'Running automated tests', 'Deploying applications'], correctIndex: 1, explanation: 'Version control (e.g. Git) tracks code history, enables collaboration, and allows rollbacks.' },
    { question: 'Which of the following is an interpreted language?', options: ['C', 'C++', 'Python', 'Rust'], correctIndex: 2, explanation: 'Python is interpreted at runtime, whereas C, C++, and Rust are compiled to machine code.' },
    { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Core Performance Utility', 'Compiled Program Unit', 'Central Program Utility'], correctIndex: 0, explanation: 'CPU stands for Central Processing Unit — the primary component that executes instructions.' },
    { question: 'In software development, what does "refactoring" mean?', options: ['Adding new features', 'Fixing security vulnerabilities', 'Restructuring existing code without changing its external behaviour', 'Writing documentation'], correctIndex: 2, explanation: 'Refactoring improves code structure, readability, or performance without altering functionality.' },
    { question: 'What is the purpose of unit testing?', options: ['Testing the entire system end-to-end', 'Testing individual components in isolation', 'Load testing the server', 'Testing the user interface'], correctIndex: 1, explanation: 'Unit tests verify that individual functions or components work correctly in isolation.' },
    { question: 'What does API stand for?', options: ['Application Programming Interface', 'Automated Process Integration', 'Application Protocol Interface', 'Asynchronous Program Instruction'], correctIndex: 0, explanation: 'An API defines how software components communicate with each other.' },
    { question: 'Which paradigm treats computation as evaluation of mathematical functions?', options: ['Object-oriented programming', 'Procedural programming', 'Functional programming', 'Event-driven programming'], correctIndex: 2, explanation: 'Functional programming avoids mutable state and emphasises pure functions.' },
    { question: 'What does "open source" software mean?', options: ['Free to use commercially', 'Source code is publicly available for anyone to view or modify', 'Maintained by a government body', 'Has no licence restrictions'], correctIndex: 1, explanation: 'Open source software has publicly available source code, allowing community contributions and modifications.' },
  ],
};

function classifyTopic(topic: string): string {
  const t = topic.toLowerCase();
  if (/\b(sql|database|db|join|query|table|schema|normal|relational|nosql|mongo|postgres|mysql|sqlite|index|foreign|primary key)\b/.test(t)) return 'databases';
  if (/\b(sort|search|algorithm|complexity|big.?o|tree|graph|heap|hash|dynamic programming|recursion|stack|queue|linked list|binary|bfs|dfs)\b/.test(t)) return 'algorithms';
  if (/\b(oop|object.oriented|class|inherit|polymorphi|encapsulat|abstract|interface|method|overrid|overload|constructor|solid)\b/.test(t)) return 'oop';
  if (/\b(network|tcp|ip|udp|http|https|dns|dhcp|router|subnet|osi|protocol|port|packet|firewall|lan|wan|socket)\b/.test(t)) return 'networking';
  return 'general';
}

function getDemoQuestions(topic: string): DemoQuestion[] {
  const category = classifyTopic(topic);
  return DEMO_BANKS[category];
}

export default router;
