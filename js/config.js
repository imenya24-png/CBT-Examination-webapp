// ===== DEFAULT CONFIG & SEED DATA =====
const DEFAULT_CONFIG = {
  // Home Page Content
  badgeText: 'Enterprise Python - Backend Development',
  mainTitle: 'Python Basic Fundamental',
  subtitle: '',
  examLabel: 'Test of knowledge',
  description: 'Programming - Algorithm - Pseudocode',
  // Basic Settings
  examTitle: 'Test of knowledge',
  totalQuestions: 50,
  questionsToAttempt: 30,
  duration: 30, // minutes
  // Navigation
  allowBackNav: false,
  allowReview: true,
  shuffleQuestions: true,
  shuffleOptions: true,
  // Security
  maxViolations: 5,
  networkGrace: 10,
  monitorVisibility: true,
  maxVisibilityViolations: 8,
  // Results
  showScoreAfter: true,
  showCorrectAnswers: true,
  // Status
  examActive: true,
  // Admin
  adminEmail: 'admin@cbt.com',
  adminPassword: 'admin123',
  protectionPassword: 'secure123',
};

const SAMPLE_QUESTIONS = [
  // MCQ - Section A
  { id: 'q1',  type: 'mcq', level: 'easy', section: 'Section A', text: 'What is programming?', options: ['A process of writing instructions for a computer', 'A type of hardware component', 'A network protocol', 'A database system'], answer: 0 },
  { id: 'q2',  type: 'mcq', level: 'easy', section: 'Section A', text: 'Which of the following best describes an algorithm?', options: ['A step-by-step solution to a problem', 'A type of programming language', 'A computer hardware component', 'A data storage device'], answer: 0 },
  { id: 'q3',  type: 'mcq', level: 'easy', section: 'Section A', text: 'What is pseudocode mainly used for?', options: ['To plan and design algorithms before coding', 'To execute programs faster', 'To store data in a database', 'To design hardware circuits'], answer: 0 },
  { id: 'q4',  type: 'mcq', level: 'easy', section: 'Section A', text: 'Which of the following is an example of a programming language?', options: ['Python', 'HTTP', 'HTML5', 'Wi-Fi'], answer: 0 },
  { id: 'q5',  type: 'mcq', level: 'easy', section: 'Section A', text: 'What does a compiler do?', options: ['Translates source code into machine code', 'Stores data permanently', 'Connects computers in a network', 'Manages hardware devices'], answer: 0 },
  { id: 'q6',  type: 'mcq', level: 'medium', section: 'Section A', text: 'What is the output of: print(2 ** 3) in Python?', options: ['6', '8', '9', '5'], answer: 1 },
  { id: 'q7',  type: 'mcq', level: 'medium', section: 'Section A', text: 'Which Python data type is used to store a sequence of items?', options: ['int', 'str', 'list', 'bool'], answer: 2 },
  { id: 'q8',  type: 'mcq', level: 'medium', section: 'Section A', text: 'What keyword is used to define a function in Python?', options: ['func', 'define', 'def', 'function'], answer: 2 },
  { id: 'q9',  type: 'mcq', level: 'medium', section: 'Section A', text: 'What is the correct way to start a for loop in Python?', options: ['for i in range(10):', 'for (i=0; i<10; i++)', 'loop i from 0 to 10', 'foreach i in 10'], answer: 0 },
  { id: 'q10', type: 'mcq', level: 'medium', section: 'Section A', text: 'What symbol is used for single-line comments in Python?', options: ['//', '/*', '#', '--'], answer: 2 },
  { id: 'q11', type: 'mcq', level: 'hard', section: 'Section B', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 1 },
  { id: 'q12', type: 'mcq', level: 'hard', section: 'Section B', text: 'Which data structure uses LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Array', 'Linked List'], answer: 1 },
  { id: 'q13', type: 'mcq', level: 'hard', section: 'Section B', text: 'What does OOP stand for?', options: ['Object-Oriented Programming', 'Open Output Protocol', 'Operational Output Processing', 'None of the above'], answer: 0 },
  { id: 'q14', type: 'mcq', level: 'medium', section: 'Section B', text: 'Which Python method is used to add an item to a list?', options: ['.add()', '.insert()', '.append()', '.push()'], answer: 2 },
  { id: 'q15', type: 'mcq', level: 'easy', section: 'Section B', text: 'What is the result of 10 % 3 in Python?', options: ['3', '1', '0', '2'], answer: 1 },
  { id: 'q16', type: 'mcq', level: 'medium', section: 'Section B', text: 'How do you get the length of a list `mylist` in Python?', options: ['mylist.size()', 'len(mylist)', 'mylist.length', 'size(mylist)'], answer: 1 },
  { id: 'q17', type: 'mcq', level: 'hard', section: 'Section B', text: 'Which of the following is a mutable data type in Python?', options: ['tuple', 'string', 'list', 'int'], answer: 2 },
  { id: 'q18', type: 'mcq', level: 'easy', section: 'Section A', text: 'What is the purpose of an IDE?', options: ['To help programmers write and test code', 'To connect to the internet', 'To store files on disk', 'To print documents'], answer: 0 },
  { id: 'q19', type: 'mcq', level: 'medium', section: 'Section A', text: 'What does the `return` statement do in a function?', options: ['Prints output to screen', 'Exits the function and sends back a value', 'Starts the function execution', 'Declares a variable'], answer: 1 },
  { id: 'q20', type: 'mcq', level: 'hard', section: 'Section B', text: 'What is recursion in programming?', options: ['A loop that runs forever', 'A function that calls itself', 'A type of variable', 'A sorting algorithm'], answer: 1 },
  { id: 'q21', type: 'mcq', level: 'medium', section: 'Section A', text: 'Which of these is NOT a valid Python variable name?', options: ['my_var', '_count', '2value', 'totalScore'], answer: 2 },

  // TRUE/FALSE - Section B
  { id: 'q22', type: 'truefalse', level: 'easy', section: 'Section A', text: 'Python is a case-sensitive programming language.', answer: true },
  { id: 'q23', type: 'truefalse', level: 'easy', section: 'Section A', text: 'A variable can start with a number in Python.', answer: false },
  { id: 'q24', type: 'truefalse', level: 'medium', section: 'Section A', text: 'In Python, indentation is used to define code blocks.', answer: true },
  { id: 'q25', type: 'truefalse', level: 'easy', section: 'Section A', text: 'The `print()` function in Python displays output on the screen.', answer: true },
  { id: 'q26', type: 'truefalse', level: 'medium', section: 'Section B', text: 'A tuple in Python can be modified after creation.', answer: false },
  { id: 'q27', type: 'truefalse', level: 'medium', section: 'Section B', text: 'Python supports both procedural and object-oriented programming.', answer: true },
  { id: 'q28', type: 'truefalse', level: 'hard', section: 'Section B', text: 'In Python, a dictionary key must be immutable.', answer: true },
  { id: 'q29', type: 'truefalse', level: 'easy', section: 'Section A', text: 'HTML is a programming language used to build logic in web apps.', answer: false },
  { id: 'q30', type: 'truefalse', level: 'medium', section: 'Section A', text: 'An algorithm must always have a defined starting and ending point.', answer: true },
  { id: 'q31', type: 'truefalse', level: 'hard', section: 'Section B', text: 'The time complexity of a linear search is O(log n).', answer: false },

  // FILL IN BLANK - Section A
  { id: 'q32', type: 'fill', level: 'easy', section: 'Section A', text: 'The Python keyword used to create a function is ________.', answer: 'def' },
  { id: 'q33', type: 'fill', level: 'easy', section: 'Section A', text: 'In Python, the built-in function to display output is ________.', answer: 'print' },
  { id: 'q34', type: 'fill', level: 'medium', section: 'Section A', text: 'The Python keyword used to repeat a block of code is ________ or while.', answer: 'for' },
  { id: 'q35', type: 'fill', level: 'medium', section: 'Section B', text: 'A ________ is a function that calls itself during execution.', answer: 'recursive function' },
  { id: 'q36', type: 'fill', level: 'hard', section: 'Section B', text: 'The data structure that follows FIFO order is called a ________.', answer: 'queue' },
  { id: 'q37', type: 'fill', level: 'easy', section: 'Section A', text: 'In Python, # is used to write a ________.', answer: 'comment' },
  { id: 'q38', type: 'fill', level: 'medium', section: 'Section B', text: 'The method used to remove the last item from a Python list is ________.', answer: 'pop' },

  // SHORT ANSWER - Section B
  { id: 'q39', type: 'short', level: 'easy', section: 'Section A', text: 'Define what an algorithm is in your own words.', answer: 'A step-by-step set of instructions designed to solve a specific problem or accomplish a task.' },
  { id: 'q40', type: 'short', level: 'medium', section: 'Section A', text: 'What is the difference between a compiler and an interpreter?', answer: 'A compiler translates the entire source code at once into machine code, while an interpreter translates and executes code line by line.' },
  { id: 'q41', type: 'short', level: 'medium', section: 'Section B', text: 'Explain what a variable is in programming.', answer: 'A variable is a named storage location in memory that holds a value which can be changed during program execution.' },
  { id: 'q42', type: 'short', level: 'hard', section: 'Section B', text: 'What is the difference between a list and a tuple in Python?', answer: 'A list is mutable (can be changed) while a tuple is immutable (cannot be changed after creation).' },
  { id: 'q43', type: 'short', level: 'medium', section: 'Section A', text: 'What does pseudocode mean and why is it useful?', answer: 'Pseudocode is an informal way of describing an algorithm using plain language. It is useful for planning code before writing it in a programming language.' },
  { id: 'q44', type: 'short', level: 'hard', section: 'Section B', text: 'Explain what object-oriented programming (OOP) is.', answer: 'OOP is a programming paradigm that organizes code into objects that contain data (attributes) and behavior (methods), promoting reuse and modularity.' },
  { id: 'q45', type: 'short', level: 'easy', section: 'Section A', text: 'What is the purpose of a loop in programming?', answer: 'A loop is used to repeat a block of code multiple times until a certain condition is met.' },
  { id: 'q46', type: 'short', level: 'medium', section: 'Section B', text: 'What is a function in Python and why do we use it?', answer: 'A function is a reusable block of code that performs a specific task. We use functions to avoid repetition and improve code organization.' },
  { id: 'q47', type: 'short', level: 'hard', section: 'Section B', text: 'Describe what Big O notation is used for.', answer: 'Big O notation is used to describe the time or space complexity of an algorithm, helping programmers understand how it scales with input size.' },

  // CODE - Section B
  { id: 'q48', type: 'code', level: 'medium', section: 'Section B', text: 'Write a Python function called `add_numbers` that takes two parameters and returns their sum.', answer: 'def add_numbers(a, b):\n    return a + b' },
  { id: 'q49', type: 'code', level: 'medium', section: 'Section B', text: 'Write a Python for loop that prints numbers from 1 to 5.', answer: 'for i in range(1, 6):\n    print(i)' },
  { id: 'q50', type: 'code', level: 'hard', section: 'Section B', text: 'Write a Python function that checks if a number is even or odd and returns "Even" or "Odd".', answer: 'def check_even_odd(n):\n    if n % 2 == 0:\n        return "Even"\n    else:\n        return "Odd"' },
];

// ===== INITIALIZE APP DATA (ASYNC) =====
async function initApp() {
  try {
    // If Supabase URL has not been configured, skip initialization
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL') {
      console.warn("Supabase has not been configured yet. Skipping auto-seeding.");
      return;
    }

    // Check if config exists, if not seed default config
    const { data: configRows, error: configError } = await supabase
      .from('config')
      .select('id')
      .eq('id', 1);
    
    if (!configError && (!configRows || configRows.length === 0)) {
      await DB.setConfig(DEFAULT_CONFIG);
      console.log("Seeded default configuration into Supabase.");
    }

    // Seed questions if database is empty
    const qs = await DB.getQuestions();
    if (qs.length === 0) {
      await DB.setQuestions(SAMPLE_QUESTIONS);
      console.log("Seeded sample questions into Supabase.");
    }
  } catch (err) {
    console.warn("Auto-initialization of DB failed/skipped:", err);
  }
}

// Run asynchronously on load
initApp();
