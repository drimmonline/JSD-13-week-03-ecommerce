// ============================================
// Seed Script - สร้างข้อสอบ 3 ชุดผ่าน POST API
// รันด้วย: node server/src/seedExams.mjs
// ============================================

const API_BASE = "http://localhost:3000/api";

// ข้อมูลข้อสอบ 3 ชุด
const exams = [
  {
    exam_name: "คณิตศาสตร์พื้นฐาน",
    description: "ข้อสอบคณิตศาสตร์พื้นฐาน สำหรับทบทวนการคำนวณ",
    category: "คณิตศาสตร์",
    time_limit_minutes: 15,
    questions: [
      {
        _id: "math-q1",
        question_text: "2 + 3 เท่ากับเท่าไหร่?",
        options: [
          { _id: "opt_a", text: "4" },
          { _id: "opt_b", text: "5" },
          { _id: "opt_c", text: "6" },
          { _id: "opt_d", text: "7" },
        ],
        correct_option_id: "opt_b",
        explanation: "2 + 3 = 5",
      },
      {
        _id: "math-q2",
        question_text: "ผลคูณของ 4 x 5 เท่ากับเท่าไหร่?",
        options: [
          { _id: "opt_a", text: "15" },
          { _id: "opt_b", text: "20" },
          { _id: "opt_c", text: "25" },
          { _id: "opt_d", text: "10" },
        ],
        correct_option_id: "opt_b",
        explanation: "4 x 5 = 20",
      },
      {
        _id: "math-q3",
        question_text: "รากที่สองของ 16 เท่ากับเท่าไหร่?",
        options: [
          { _id: "opt_a", text: "2" },
          { _id: "opt_b", text: "3" },
          { _id: "opt_c", text: "4" },
          { _id: "opt_d", text: "8" },
        ],
        correct_option_id: "opt_c",
        explanation: "sqrt(16) = 4",
      },
      {
        _id: "math-q4",
        question_text: "ถ้า x + 5 = 12, x เท่ากับเท่าไหร่?",
        options: [
          { _id: "opt_a", text: "5" },
          { _id: "opt_b", text: "6" },
          { _id: "opt_c", text: "7" },
          { _id: "opt_d", text: "8" },
        ],
        correct_option_id: "opt_c",
        explanation: "x = 12 - 5 = 7",
      },
      {
        _id: "math-q5",
        question_text: "เศษของ 17 หารด้วย 5 เท่ากับเท่าไหร่?",
        options: [
          { _id: "opt_a", text: "1" },
          { _id: "opt_b", text: "2" },
          { _id: "opt_c", text: "3" },
          { _id: "opt_d", text: "4" },
        ],
        correct_option_id: "opt_b",
        explanation: "17 = 5 x 3 + 2, เศษคือ 2",
      },
    ],
  },
  {
    exam_name: "English Grammar Basics",
    description: "Basic English grammar test for beginners",
    category: "ภาษาอังกฤษ",
    time_limit_minutes: 10,
    questions: [
      {
        _id: "eng-q1",
        question_text: 'Choose the correct form: "She ___ to school every day."',
        options: [
          { _id: "opt_a", text: "go" },
          { _id: "opt_b", text: "goes" },
          { _id: "opt_c", text: "going" },
          { _id: "opt_d", text: "gone" },
        ],
        correct_option_id: "opt_b",
        explanation: "Third person singular uses 'goes'",
      },
      {
        _id: "eng-q2",
        question_text: 'Which word is a noun? "The cat sat on the mat."',
        options: [
          { _id: "opt_a", text: "sat" },
          { _id: "opt_b", text: "on" },
          { _id: "opt_c", text: "cat" },
          { _id: "opt_d", text: "the" },
        ],
        correct_option_id: "opt_c",
        explanation: "'cat' is a noun",
      },
      {
        _id: "eng-q3",
        question_text: 'What is the past tense of "run"?',
        options: [
          { _id: "opt_a", text: "runned" },
          { _id: "opt_b", text: "ran" },
          { _id: "opt_c", text: "running" },
          { _id: "opt_d", text: "runs" },
        ],
        correct_option_id: "opt_b",
        explanation: "The past tense of 'run' is 'ran'",
      },
      {
        _id: "eng-q4",
        question_text: '"___ is your name?" - "My name is John."',
        options: [
          { _id: "opt_a", text: "What" },
          { _id: "opt_b", text: "Where" },
          { _id: "opt_c", text: "How" },
          { _id: "opt_d", text: "Why" },
        ],
        correct_option_id: "opt_a",
        explanation: "'What' is used to ask about names",
      },
      {
        _id: "eng-q5",
        question_text: 'Choose the correct article: "I have ___ apple."',
        options: [
          { _id: "opt_a", text: "a" },
          { _id: "opt_b", text: "an" },
          { _id: "opt_c", text: "the" },
          { _id: "opt_d", text: "no article needed" },
        ],
        correct_option_id: "opt_b",
        explanation: "Use 'an' before words starting with a vowel sound",
      },
    ],
  },
  {
    exam_name: "Computer Science 101",
    description: "Basic computer science concepts (ไม่ระบุ category จะเป็น 'ทั่วไป')",
    time_limit_minutes: 10,
    questions: [
      {
        _id: "cs-q1",
        question_text: "CPU ย่อมาจากคำว่าอะไร?",
        options: [
          { _id: "opt_a", text: "Central Processing Unit" },
          { _id: "opt_b", text: "Computer Personal Unit" },
          { _id: "opt_c", text: "Central Program Utility" },
          { _id: "opt_d", text: "Computer Processing Unit" },
        ],
        correct_option_id: "opt_a",
        explanation: "CPU = Central Processing Unit",
      },
      {
        _id: "cs-q2",
        question_text: "RAM หมายถึงอะไร?",
        options: [
          { _id: "opt_a", text: "Random Access Memory" },
          { _id: "opt_b", text: "Read Access Memory" },
          { _id: "opt_c", text: "Random Action Memory" },
          { _id: "opt_d", text: "Read Action Memory" },
        ],
        correct_option_id: "opt_a",
        explanation: "RAM = Random Access Memory",
      },
      {
        _id: "cs-q3",
        question_text: "ภาษาโปรแกรมใดเป็น interpreted language?",
        options: [
          { _id: "opt_a", text: "C" },
          { _id: "opt_b", text: "Python" },
          { _id: "opt_c", text: "Rust" },
          { _id: "opt_d", text: "Go" },
        ],
        correct_option_id: "opt_b",
        explanation: "Python เป็น interpreted language",
      },
      {
        _id: "cs-q4",
        question_text: "HTML ใช้สำหรับทำอะไร?",
        options: [
          { _id: "opt_a", text: "สร้างหน้าเว็บ" },
          { _id: "opt_b", text: "คำนวณตัวเลข" },
          { _id: "opt_c", text: "จัดการฐานข้อมูล" },
          { _id: "opt_d", text: "สร้างเกม" },
        ],
        correct_option_id: "opt_a",
        explanation: "HTML = HyperText Markup Language",
      },
      {
        _id: "cs-q5",
        question_text: "SQL ย่อมาจากอะไร?",
        options: [
          { _id: "opt_a", text: "Structured Query Language" },
          { _id: "opt_b", text: "Simple Query Language" },
          { _id: "opt_c", text: "Standard Query Logic" },
          { _id: "opt_d", text: "System Query Language" },
        ],
        correct_option_id: "opt_a",
        explanation: "SQL = Structured Query Language",
      },
    ],
  },
];

// ฟังก์ชันseed ข้อสอบทีละรายการ
async function seedExams() {
  console.log("เริ่ม seed ข้อสอบ...\n");

  for (let i = 0; i < exams.length; i++) {
    const exam = exams[i];
    try {
      const response = await fetch(`${API_BASE}/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exam),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`[${i + 1}/3] ✓ สำเร็จ: "${exam.exam_name}" (category: ${exam.category || "ไม่ระบุ"})`);
      } else {
        console.log(`[${i + 1}/3] ✗ ไม่สำเร็จ: "${exam.exam_name}" - ${data.msg}`);
      }
    } catch (err) {
      console.log(`[${i + 1}/3] ✗ Error: ${err.message}`);
    }
  }

  console.log("\nSeed เสร็จสิ้น!");
}

seedExams();
