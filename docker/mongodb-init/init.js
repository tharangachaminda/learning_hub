// MongoDB initialization script for LearningHub

// Switch to learning_hub database
db = db.getSiblingDB('learning_hub');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'role', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        role: {
          bsonType: 'string',
          enum: ['student', 'parent', 'teacher', 'admin']
        },
        profile: {
          bsonType: 'object',
          properties: {
            firstName: { bsonType: 'string' },
            lastName: { bsonType: 'string' },
            grade: { bsonType: 'number' },
            dateOfBirth: { bsonType: 'date' }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('questions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'subject', 'grade', 'difficulty', 'content', 'createdAt'],
      properties: {
        type: {
          bsonType: 'string',
          enum: ['multiple_choice', 'fill_blank', 'true_false', 'open_ended']
        },
        subject: {
          bsonType: 'string',
          enum: ['math', 'english', 'science', 'social_studies']
        },
        grade: {
          bsonType: 'number',
          minimum: 1,
          maximum: 12
        },
        difficulty: {
          bsonType: 'string',
          enum: ['easy', 'medium', 'hard']
        },
        content: {
          bsonType: 'object',
          required: ['question'],
          properties: {
            question: { bsonType: 'string' },
            options: { bsonType: 'array' },
            answer: { bsonType: 'string' },
            explanation: { bsonType: 'string' }
          }
        },
        tags: { bsonType: 'array' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'startTime', 'status'],
      properties: {
        userId: { bsonType: 'objectId' },
        startTime: { bsonType: 'date' },
        endTime: { bsonType: 'date' },
        status: {
          bsonType: 'string',
          enum: ['active', 'completed', 'abandoned']
        },
        questions: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              questionId: { bsonType: 'objectId' },
              userAnswer: { bsonType: 'string' },
              isCorrect: { bsonType: 'bool' },
              timeSpent: { bsonType: 'number' },
              answeredAt: { bsonType: 'date' }
            }
          }
        },
        score: {
          bsonType: 'object',
          properties: {
            correct: { bsonType: 'number' },
            total: { bsonType: 'number' },
            percentage: { bsonType: 'number' }
          }
        }
      }
    }
  }
});

db.createCollection('progress', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'subject', 'updatedAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        subject: { bsonType: 'string' },
        grade: { bsonType: 'number' },
        topics: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              name: { bsonType: 'string' },
              mastery: { bsonType: 'number' },
              questionsAnswered: { bsonType: 'number' },
              questionsCorrect: { bsonType: 'number' },
              lastPracticed: { bsonType: 'date' }
            }
          }
        },
        overallMastery: { bsonType: 'number' },
        streakDays: { bsonType: 'number' },
        totalQuestionsAnswered: { bsonType: 'number' },
        totalCorrectAnswers: { bsonType: 'number' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'role': 1 });
db.questions.createIndex({ 'subject': 1, 'grade': 1, 'difficulty': 1 });
db.questions.createIndex({ 'type': 1 });
db.questions.createIndex({ 'tags': 1 });
db.sessions.createIndex({ 'userId': 1 });
db.sessions.createIndex({ 'startTime': -1 });
db.sessions.createIndex({ 'status': 1 });
db.progress.createIndex({ 'userId': 1, 'subject': 1 }, { unique: true });

// Insert sample data
const sampleUser = {
  email: 'demo@learninghub.com',
  role: 'student',
  profile: {
    firstName: 'Demo',
    lastName: 'Student',
    grade: 3,
    dateOfBirth: new Date('2016-05-15')
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const userId = db.users.insertOne(sampleUser).insertedId;

// Sample questions for Grade 3 Math
const sampleQuestions = [
  {
    type: 'multiple_choice',
    subject: 'math',
    grade: 3,
    difficulty: 'easy',
    content: {
      question: 'What is 5 + 3?',
      options: ['6', '7', '8', '9'],
      answer: '8',
      explanation: 'When you add 5 + 3, you count 3 more from 5: 6, 7, 8.'
    },
    tags: ['addition', 'basic'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'multiple_choice',
    subject: 'math',
    grade: 3,
    difficulty: 'easy',
    content: {
      question: 'Which number comes after 19?',
      options: ['18', '20', '21', '22'],
      answer: '20',
      explanation: 'The number that comes after 19 is 20.'
    },
    tags: ['counting', 'numbers'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'multiple_choice',
    subject: 'math',
    grade: 3,
    difficulty: 'medium',
    content: {
      question: 'If you have 12 apples and eat 4, how many are left?',
      options: ['6', '7', '8', '9'],
      answer: '8',
      explanation: 'Start with 12 apples. If you eat 4, you subtract: 12 - 4 = 8 apples left.'
    },
    tags: ['subtraction', 'word_problems'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.questions.insertMany(sampleQuestions);

// Sample progress for demo user
const sampleProgress = {
  userId: userId,
  subject: 'math',
  grade: 3,
  topics: [
    {
      name: 'Addition',
      mastery: 0.7,
      questionsAnswered: 10,
      questionsCorrect: 7,
      lastPracticed: new Date()
    },
    {
      name: 'Subtraction',
      mastery: 0.6,
      questionsAnswered: 8,
      questionsCorrect: 5,
      lastPracticed: new Date()
    }
  ],
  overallMastery: 0.65,
  streakDays: 3,
  totalQuestionsAnswered: 18,
  totalCorrectAnswers: 12,
  updatedAt: new Date()
};

db.progress.insertOne(sampleProgress);

print('LearningHub database initialized successfully!');
print('Created collections: users, questions, sessions, progress');
print('Added sample data for demo purposes');
print('Database is ready for use.');