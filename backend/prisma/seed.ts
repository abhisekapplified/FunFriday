import { PrismaClient, GameType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@funfriday.com' },
    update: {},
    create: { email: 'admin@funfriday.com', passwordHash, name: 'Admin Host', role: 'HOST' },
  });

  await prisma.question.deleteMany();

  await prisma.question.createMany({
    data: [
      // --- TRIVIA ---
      { gameType: GameType.TRIVIA, question: 'What is the primary color in the Google logo that appears twice?', answer: 'Blue', options: ['Red', 'Blue', 'Green', 'Yellow'], category: 'Tech', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'Which protocol is used for real-time bi-directional communication?', answer: 'WebSockets', options: ['HTTP', 'FTP', 'WebSockets', 'SMTP'], category: 'Tech', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: "What is the output of typeof null in JavaScript?", answer: "'object'", options: ["'null'", "'object'", "'undefined'", "'number'"], category: 'Programming', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'Which planet is known as the Red Planet?', answer: 'Mars', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], category: 'Science', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'What year was the World Wide Web invented?', answer: '1989', options: ['1975', '1989', '1995', '2001'], category: 'Tech', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'What is the largest ocean on Earth?', answer: 'Pacific Ocean', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], category: 'Geography', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'Which programming language was created by Brendan Eich in 10 days?', answer: 'JavaScript', options: ['Python', 'Java', 'JavaScript', 'C++'], category: 'Programming', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'How many bits are in a byte?', answer: '8', options: ['4', '8', '16', '32'], category: 'Tech', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'What does CPU stand for?', answer: 'Central Processing Unit', options: ['Computer Processing Unit', 'Central Processing Unit', 'Core Processing Unit', 'Central Program Utility'], category: 'Tech', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'What is the chemical symbol for Gold?', answer: 'Au', options: ['Go', 'Gd', 'Au', 'Ag'], category: 'Science', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'Which sorting algorithm has the best average-case time complexity?', answer: 'Merge Sort', options: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Insertion Sort'], category: 'Programming', timeLimit: 15 },
      { gameType: GameType.TRIVIA, question: 'What does RAM stand for?', answer: 'Random Access Memory', options: ['Random Access Memory', 'Read Access Module', 'Runtime Application Memory', 'Rapid Access Module'], category: 'Tech', timeLimit: 15 },

      // --- WORD SCRAMBLE ---
      { gameType: GameType.WORD_SCRAMBLE, question: 'Popular JavaScript framework made by Facebook', answer: 'REACT', options: [], category: 'Tech', timeLimit: 30 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Programming language that runs in the browser', answer: 'JAVASCRIPT', options: [], category: 'Programming', timeLimit: 35 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Stores data in key-value pairs, a famous in-memory database', answer: 'REDIS', options: [], category: 'Tech', timeLimit: 25 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Version control system created by Linus Torvalds', answer: 'GIT', options: [], category: 'Tech', timeLimit: 20 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Container platform for packaging applications', answer: 'DOCKER', options: [], category: 'Tech', timeLimit: 25 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'The largest planet in our solar system', answer: 'JUPITER', options: [], category: 'Science', timeLimit: 30 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Serpentine language loved for data science and AI', answer: 'PYTHON', options: [], category: 'Programming', timeLimit: 25 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Platform for hosting and sharing code repositories', answer: 'GITHUB', options: [], category: 'Tech', timeLimit: 25 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Cloud computing giant from Amazon', answer: 'AWS', options: [], category: 'Tech', timeLimit: 20 },
      { gameType: GameType.WORD_SCRAMBLE, question: 'Microsoft\'s cloud computing platform', answer: 'AZURE', options: [], category: 'Tech', timeLimit: 25 },

      // --- TRUE OR FALSE ---
      { gameType: GameType.TRUE_OR_FALSE, question: 'JavaScript was created in just 10 days.', answer: 'True', options: ['True', 'False'], category: 'Programming', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'Python is a compiled language.', answer: 'False', options: ['True', 'False'], category: 'Programming', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'The Great Wall of China is visible from space with the naked eye.', answer: 'False', options: ['True', 'False'], category: 'General', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'HTML is a programming language.', answer: 'False', options: ['True', 'False'], category: 'Programming', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'React is maintained by Facebook (Meta).', answer: 'True', options: ['True', 'False'], category: 'Tech', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'Git and GitHub are the same thing.', answer: 'False', options: ['True', 'False'], category: 'Tech', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'The sun is a star.', answer: 'True', options: ['True', 'False'], category: 'Science', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'SQL stands for Structured Query Language.', answer: 'True', options: ['True', 'False'], category: 'Programming', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'TypeScript is a superset of JavaScript.', answer: 'True', options: ['True', 'False'], category: 'Programming', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'Node.js runs JavaScript on the browser.', answer: 'False', options: ['True', 'False'], category: 'Tech', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'HTTP and HTTPS use the same port number.', answer: 'False', options: ['True', 'False'], category: 'Tech', timeLimit: 10 },
      { gameType: GameType.TRUE_OR_FALSE, question: 'A URL and a URI are exactly the same thing.', answer: 'False', options: ['True', 'False'], category: 'Tech', timeLimit: 10 },
    ],
  });

  console.log('Database seeded!');
  console.log('Default host login: admin@funfriday.com / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
