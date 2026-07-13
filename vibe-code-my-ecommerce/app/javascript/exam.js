// ============================================
// Exam Module - ระบบข้อสอบ, จับเวลา, Sidebar, ตรวจคำตอบ
// ============================================

window.API_BASE = window.API_BASE || "http://localhost:3000/api";

// ===== State ของระบบข้อสอบ =====
let examState = {
  exam: null,
  answers: {},
  currentIndex: 0,
  timeLeft: 0,
  timerInterval: null,
  isSubmitted: false,
  result: null,
  startTime: null,
};

// ===== ดึงรายการข้อสอบทั้งหมด =====
async function fetchExams() {
  const response = await fetch(`${API_BASE}/exams`);
  if (!response.ok) throw new Error("ดึงรายการข้อสอบไม่สำเร็จ");
  return await response.json();
}

// ===== ดึงข้อมูลข้อสอบตาม ID =====
async function fetchExamById(id) {
  // 🛠️ ป้องกันการส่ง ID ผิดเพี้ยน: ล้างค่าช่องว่างรอบข้างออกก่อนยิงเสมอ
  const cleanId = String(id).trim();
  const response = await fetch(`${API_BASE}/exams/${cleanId}`);
  if (!response.ok) throw new Error("ไม่พบข้อสอบ");
  return await response.json();
}

// ===== ดูประวัติการทำข้อสอบของฉัน =====
async function fetchMyExamHistory(examId = null) {
  const url = examId
    ? `${API_BASE}/exams/history/my?exam_id=${examId}`
    : `${API_BASE}/exams/history/my`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) return [];
  return await response.json();
}

// ===== ส่งคำตอบ =====
async function submitExamAnswers() {
  const { exam, answers, startTime } = examState;
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  const response = await fetch(`${API_BASE}/exams/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      exam_id: exam._id,
      answers: answers,
      time_spent_seconds: timeSpent,
    }),
  });

  if (!response.ok) throw new Error("ส่งข้อสอบไม่สำเร็จ");
  return await response.json();
}

// ===========================================
// Exam List Page - หน้าเลือกข้อสอบ
// ===========================================
async function initExamListPage() {
  setupNavbar();
  updateCartCount();

  const grid = document.getElementById("exam-grid");
  if (!grid) return;

  grid.innerHTML =
    '<div class="loading-overlay"><span class="spinner"></span> กำลังโหลด...</div>';

  try {
    const exams = await fetchExams();

    let historyMap = {};
    if (isLoggedIn()) {
      const history = await fetchMyExamHistory();
      history.forEach((h) => {
        if (!historyMap[h.exam_id]) historyMap[h.exam_id] = h;
      });
    }

    renderExamList(exams, historyMap);
    renderCategoryTabs(exams);
    setupExamListEvents();
  } catch (err) {
    grid.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--color-error);">${err.message}</div>`;
  }
}

function renderCategoryTabs(exams) {
  const container = document.getElementById("category-tabs");
  if (!container) return;

  const categories = [
    "ทั้งหมด",
    ...new Set(exams.map((e) => e.category || "ทั่วไป")),
  ];
  container.innerHTML = categories
    .map(
      (cat, i) =>
        `<button class="category-tab ${i === 0 ? "active" : ""}" data-category="${cat}">${cat}</button>`,
    )
    .join("");
}

// ผูก Event แบบปลอดภัยให้กับหน้าเลือกข้อสอบ
function setupExamListEvents() {
  const tabsContainer = document.getElementById("category-tabs");
  if (tabsContainer) {
    tabsContainer.addEventListener("click", (e) => {
      const tab = e.target.closest(".category-tab");
      if (tab) {
        const cat = tab.getAttribute("data-category");
        filterByCategory(cat);
      }
    });
  }

  const gridContainer = document.getElementById("exam-grid");
  if (gridContainer) {
    gridContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-start-exam");
      if (btn) {
        const examId = btn.getAttribute("data-exam-id");
        startExam(examId);
      }
    });
  }
}

function filterByCategory(category) {
  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.getAttribute("data-category") === category,
    );
  });
  loadExamList(category);
}

let allExamsCache = [];

async function loadExamList(category = "ทั้งหมด") {
  const grid = document.getElementById("exam-grid");
  if (!grid) return;

  try {
    if (allExamsCache.length === 0) {
      allExamsCache = await fetchExams();
    }

    let filtered = allExamsCache;
    if (category !== "ทั้งหมด") {
      filtered = allExamsCache.filter(
        (e) => (e.category || "ทั่วไป") === category,
      );
    }

    let historyMap = {};
    if (isLoggedIn()) {
      const history = await fetchMyExamHistory();
      history.forEach((h) => {
        if (!historyMap[h.exam_id]) historyMap[h.exam_id] = h;
      });
    }

    renderExamList(filtered, historyMap);
  } catch (err) {
    grid.innerHTML = `<div style="text-align:center; color:var(--color-error);">${err.message}</div>`;
  }
}

function renderExamList(exams, historyMap = {}) {
  const grid = document.getElementById("exam-grid");
  if (!grid) return;

  if (exams.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--color-gray-500);">
        ยังไม่มีข้อสอบในระบบ
      </div>`;
    return;
  }

  grid.innerHTML = exams
    .map((exam) => {
      const hist = historyMap[exam._id];
      const histText = hist
        ? `เคยทำแล้ว: คะแนน ${hist.score}% (${new Date(hist.completed_at).toLocaleDateString("th-TH")})`
        : "ยังไม่เคยทำ";

      return `
      <div class="exam-card">
        <div class="exam-card-category">${exam.category || "ทั่วไป"}</div>
        <h3 class="exam-card-title">${exam.exam_name || "ไม่มีชื่อชุดข้อสอบ"}</h3>
        <p class="exam-card-desc">${exam.description || ""}</p>
        <div class="exam-card-meta">
          <span>📝 ${exam.question_count || 0} ข้อ</span>
          <span>⏱ ${exam.time_limit_minutes || 0} นาที</span>
        </div>
        <div class="exam-card-history">${histText}</div>
        <button class="btn btn-primary btn-start-exam" style="width:100%;" data-exam-id="${exam._id}">
          เริ่มทำข้อสอบ
        </button>
      </div>`;
    })
    .join("");
}

// ===== เริ่มทำข้อสอบ =====
async function startExam(examId) {
  if (!isLoggedIn()) {
    window.location.href = "auth.html";
    return;
  }

  if (!examId || examId === "undefined" || examId === "null") {
    alert("ข้อมูลข้อสอบไม่ถูกต้อง ไม่สามารถเริ่มสอบได้");
    return;
  }

  try {
    const exam = await fetchExamById(examId);
    examState = {
      exam,
      answers: {},
      currentIndex: 0,
      timeLeft: exam.time_limit_minutes * 60,
      timerInterval: null,
      isSubmitted: false,
      result: null,
      startTime: Date.now(),
    };

    // 🛠️ ปรับปรุง: ใช้ encodeURIComponent เพื่อควบคุมอักขระรอยต่อให้ปลอดภัยก่อนส่งไปห้องสอบ
    window.location.href = `exam-room.html?exam_id=${encodeURIComponent(examId)}`;
  } catch (err) {
    alert(err.message);
  }
}

// ===========================================
// Exam Room Page - หน้าทำข้อสอบ
// ===========================================
async function initExamRoomPage() {
  if (!requireAuth()) return;
  setupNavbar();

  const params = new URLSearchParams(window.location.search);
  let examId = params.get("exam_id");

  if (!examId) {
    document.getElementById("quiz-content").innerHTML =
      '<div style="text-align:center; padding:2rem;">ไม่พบพารามิเตอร์ข้อสอบ</div>';
    return;
  }

  try {
    // 🛠️ ปรับปรุงไม้ตาย: สั่งถอดรหัสอักขระพิเศษภาษาไทยเพื่อล้างตัวต่างดาว %EF%BF%BD ออกไปให้หมดจด
    examId = decodeURIComponent(examId).trim();

    const exam = await fetchExamById(examId);
    examState = {
      exam,
      answers: {},
      currentIndex: 0,
      timeLeft: exam.time_limit_minutes * 60,
      timerInterval: null,
      isSubmitted: false,
      result: null,
      startTime: Date.now(),
    };

    setupExamRoomEvents();
    renderQuiz();
    startTimer();
  } catch (err) {
    document.getElementById("quiz-content").innerHTML =
      `<div style="text-align:center; padding:2rem; color:var(--color-error);">${err.message}</div>`;
  }
}

// 🛠️ ผูก Event Listener หน้าห้องสอบ
function setupExamRoomEvents() {
  const quizContent = document.getElementById("quiz-content");
  if (!quizContent) return;

  quizContent.addEventListener("click", (e) => {
    const optionItem = e.target.closest(".option-item");
    if (optionItem && !examState.isSubmitted) {
      const qId = optionItem.getAttribute("data-q-id");
      const optId = optionItem.getAttribute("data-opt-id");
      selectOption(qId, optId);
    }

    if (e.target.closest(".btn-prev-q")) {
      prevQuestion();
    }

    if (e.target.closest(".btn-next-q")) {
      nextQuestion();
    }

    if (e.target.closest(".btn-submit-quiz")) {
      confirmSubmit();
    }
  });

  const sidebarGrid = document.getElementById("question-nav-grid");
  if (sidebarGrid) {
    sidebarGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".question-nav-btn");
      if (btn) {
        const index = parseInt(btn.getAttribute("data-index"), 10);
        goToQuestion(index);
      }
    });
  }
}

// ===== Render ข้อสอบ =====
function renderQuiz() {
  const { exam, currentIndex, answers, isSubmitted } = examState;
  if (!exam || !exam.questions || exam.questions.length === 0) {
    document.getElementById("quiz-content").innerHTML =
      '<div style="text-align:center; padding:2rem;">ไม่มีรายการข้อสอบในระบบ</div>';
    return;
  }

  const question = exam.questions[currentIndex];
  const total = exam.questions.length;

  document.getElementById("quiz-title").textContent = exam.exam_name;

  const questionArea = document.getElementById("question-area");
  questionArea.innerHTML = `
    <div class="question-number">ข้อที่ ${currentIndex + 1} / ${total}</div>
    <div class="question-text">${question.question_text}</div>
    <div class="options-list">
      ${question.options
        .map((opt) => {
          const isSelected = answers[question._id] === opt._id;
          let extraClass = "";
          if (isSubmitted && isSelected) {
            extraClass =
              opt._id === question.correct_option_id ? "correct" : "incorrect";
          } else if (isSubmitted) {
            if (opt._id === question.correct_option_id) extraClass = "correct";
          } else if (isSelected) {
            extraClass = "selected";
          }

          return `
          <div class="option-item ${extraClass}" data-q-id="${question._id}" data-opt-id="${opt._id}">
            <div class="option-radio"></div>
            <span>${opt.text}</span>
          </div>`;
        })
        .join("")}
    </div>
    ${isSubmitted ? renderExplanation(question) : ""}
  `;

  const nav = document.getElementById("quiz-nav");
  nav.innerHTML = `
    <button class="btn btn-outline btn-prev-q" ${currentIndex === 0 ? "disabled" : ""}>
      ◀ ก่อนหน้า
    </button>
    ${
      currentIndex === total - 1 && !isSubmitted
        ? `<button class="btn btn-primary btn-submit-quiz">ส่งข้อสอบ</button>`
        : `<button class="btn btn-outline btn-next-q" ${currentIndex === total - 1 ? "disabled" : ""}>
            ถัดไป ▶
          </button>`
    }
  `;

  renderSidebar();
}

function renderExplanation(question) {
  if (!question.explanation) return "";
  return `
    <div class="explanation-box">
      <strong>เฉลย:</strong> ${question.explanation}
    </div>`;
}

// ===== Sidebar Navigation =====
function renderSidebar() {
  const { exam, answers, currentIndex } = examState;
  const grid = document.getElementById("question-nav-grid");
  if (!grid || !exam) return;

  grid.innerHTML = exam.questions
    .map((q, i) => {
      let cls = "";
      if (i === currentIndex) cls = "current";
      else if (answers[q._id]) cls = "answered";

      return `<button class="question-nav-btn ${cls}" data-index="${i}">${i + 1}</button>`;
    })
    .join("");
}

function goToQuestion(index) {
  examState.currentIndex = index;
  renderQuiz();
}

function nextQuestion() {
  if (examState.currentIndex < examState.exam.questions.length - 1) {
    examState.currentIndex++;
    renderQuiz();
  }
}

function prevQuestion() {
  if (examState.currentIndex > 0) {
    examState.currentIndex--;
    renderQuiz();
  }
}

function selectOption(questionId, optionId) {
  if (examState.isSubmitted) return;
  examState.answers[questionId] = optionId;
  renderQuiz();
}

// ===== Timer =====
function startTimer() {
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;

  examState.timerInterval = setInterval(() => {
    examState.timeLeft--;

    const minutes = Math.floor(examState.timeLeft / 60);
    const seconds = examState.timeLeft % 60;
    timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    timerEl.className = "timer";
    if (examState.timeLeft <= 60) timerEl.classList.add("danger");
    else if (examState.timeLeft <= 300) timerEl.classList.add("warning");

    if (examState.timeLeft <= 0) {
      clearInterval(examState.timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function stopTimer() {
  if (examState.timerInterval) {
    clearInterval(examState.timerInterval);
    examState.timerInterval = null;
  }
}

// ===== ส่งข้อสอบ =====
async function confirmSubmit() {
  const unanswered =
    examState.exam.questions.length - Object.keys(examState.answers).length;
  if (unanswered > 0) {
    if (
      !confirm(
        `ยังมี ${unanswered} ข้อที่ยังไม่ได้ตอบ ต้องการส่งข้อสอบหรือไม่?`,
      )
    ) {
      return;
    }
  } else {
    if (!confirm("ต้องการส่งข้อสอบหรือไม่?")) return;
  }

  await doSubmit();
}

async function autoSubmit() {
  alert("หมดเวลา! ระบบจะส่งข้อสอบโดยอัตโนมัติ");
  await doSubmit();
}

async function doSubmit() {
  stopTimer();

  try {
    const result = await submitExamAnswers();
    examState.isSubmitted = true;
    examState.result = result;
    renderResult(result);
  } catch (err) {
    alert(err.message);
    startTimer();
  }
}

// ===== แสดงผลลัพธ์ =====
function renderResult(result) {
  const content = document.getElementById("quiz-content");
  if (!content) return;

  const timeSpent = result.result.time_spent_seconds;
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  let html = `
    <div class="quiz-result">
      <div class="quiz-result-header">
        <div class="quiz-result-score">${result.result.score}%</div>
        <p>ตอบถูก ${result.result.correct_count} จาก ${result.result.total_questions} ข้อ</p>
        <div class="quiz-result-meta">
          <span>⏱ เวลาที่ใช้: ${minutes} นาที ${seconds} วินาที</span>
        </div>
        <div style="margin-top:1.5rem;">
          <a href="exam-list.html" class="btn btn-outline">กลับไปหน้าเลือกข้อสอบ</a>
        </div>
      </div>

      <h3 style="margin-bottom:1.5rem;">เฉลยรายข้อ</h3>
      <div class="quiz-result-answers">
  `;

  result.answer_details.forEach((detail, i) => {
    html += `
      <div class="result-question">
        <div class="result-question-header">
          <span class="result-question-number">ข้อที่ ${i + 1}</span>
          <span class="result-question-status ${detail.is_correct ? "correct" : "incorrect"}">
            ${detail.is_correct ? "✓ ถูก" : "✗ ผิด"}
          </span>
        </div>
        <div class="question-text" style="font-size:0.9375rem; margin-bottom:0.75rem;">${detail.question_text}</div>
        <div class="options-list" style="pointer-events:none;">
          ${detail.options
            .map((opt) => {
              let cls = "";
              if (opt._id === detail.correct_answer) cls = "correct";
              else if (opt._id === detail.user_answer && !detail.is_correct)
                cls = "incorrect";
              return `
                <div class="option-item ${cls}">
                  <div class="option-radio"></div>
                  <span>${opt.text}</span>
                </div>`;
            })
            .join("")}
        </div>
        ${detail.explanation ? `<div class="explanation-box"><strong>เฉลย:</strong> ${detail.explanation}</div>` : ""}
      </div>`;
  });

  html += `</div></div>`;
  content.innerHTML = html;
}

// ===== ตรวจสอบเพื่อแยกหน้าการรัน =====
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("quiz-content")) {
    initExamRoomPage();
  } else if (document.getElementById("exam-grid")) {
    initExamListPage();
  }
});
