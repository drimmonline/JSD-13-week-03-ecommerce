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
// ===== ส่งคำตอบ (แก้ไขโครงสร้างการส่งให้ถูกต้องแม่นยำ) =====
async function submitExamAnswers() {
  const { exam, answers, startTime } = examState;
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  // 🛠️ Backend คาดหมาย answers เป็น Object { [questionId]: selectedOptionId }
  //    ไม่ใช่ Array — ส่งตรงจาก examState.answers เลย
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

// ===== เริ่มทำข้อสอบ (แสดง modal รายละเอียดก่อน) =====
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
    // ดึงข้อมูลข้อสอบ + ประวัติการทำ
    const exam = await fetchExamById(examId);
    let history = null;
    if (isLoggedIn()) {
      const historyArr = await fetchMyExamHistory(examId);
      if (historyArr.length > 0) history = historyArr[0];
    }

    showExamDetailModal(exam, history, examId);
  } catch (err) {
    alert(err.message);
  }
}

// ===== แสดง Modal รายละเอียดข้อสอบ =====
function showExamDetailModal(exam, history, examId) {
  const modal = document.getElementById("exam-detail-modal");
  const body = document.getElementById("exam-modal-body");
  if (!modal || !body) return;

  const historyHTML = history
    ? `
    <div class="exam-card-history" style="margin-bottom:0;">
      <strong>ประวัติการทำ:</strong><br/>
      คะแนน ${history.score}% (${history.correct_count}/${history.total_questions} ข้อ)<br/>
      เวลาที่ใช้: ${Math.floor(history.time_spent_seconds / 60)} นาที ${history.time_spent_seconds % 60} วินาที<br/>
      วันที่ทำ: ${new Date(history.completed_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
    </div>`
    : `<div style="font-size:0.8rem; color:var(--color-gray-500); margin-bottom:0;">ยังไม่เคยทำข้อสอบชุดนี้</div>`;

  body.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <div style="font-size:0.625rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-gray-500); margin-bottom:0.5rem;">
        ${exam.category || "ทั่วไป"}
      </div>
      <h2 style="font-size:1.25rem; font-weight:700; margin-bottom:0.5rem;">${exam.exam_name}</h2>
      <p style="font-size:0.875rem; color:var(--color-gray-500); line-height:1.6; margin-bottom:1rem;">
        ${exam.description || "ไม่มีรายละเอียด"}
      </p>
      <div style="display:flex; gap:1.5rem; font-size:0.8rem; color:var(--color-gray-600); margin-bottom:1rem;">
        <span>📝 ${exam.question_count || 0} ข้อ</span>
        <span>⏱ ${exam.time_limit_minutes || 0} นาที</span>
      </div>
      ${historyHTML}
    </div>
    <div style="display:flex; gap:0.75rem;">
      <button class="btn btn-outline" id="exam-modal-cancel" style="flex:1;">ยกเลิก</button>
      <button class="btn btn-primary" id="exam-modal-confirm" style="flex:1;">ยืนยันทำข้อสอบ</button>
    </div>`;

  modal.style.display = "flex";

  // ปิด modal
  const closeModal = () => {
    modal.style.display = "none";
  };
  document
    .getElementById("exam-modal-close")
    .addEventListener("click", closeModal);
  document
    .getElementById("exam-modal-cancel")
    .addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ยืนยัน -> ไปหน้าห้องสอบ
  document
    .getElementById("exam-modal-confirm")
    .addEventListener("click", () => {
      modal.style.display = "none";
      window.location.href = `exam-room.html?exam_id=${encodeURIComponent(examId)}`;
    });
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

    // 📌 แจ้งเตือนเมื่อผู้ใช้พยายามออกจากหน้า (ปิดแท็บ / refresh / กดลิงก์)
    setupLeaveWarning();
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
        .map((opt, oi) => {
          const isSelected = answers[question._id] === opt._id;
          // 🛠️ correct_option_id เป็นตัวอักษร A/B/C/D -> แปลงเป็น index เพื่อเทียบกับตำแหน่ง option
          const correctIndex = question.correct_option_id
            ? question.correct_option_id.charCodeAt(0) - 65
            : -1;
          const isCorrectOpt = oi === correctIndex;

          let extraClass = "";
          if (isSubmitted && isSelected) {
            extraClass = isCorrectOpt ? "correct" : "incorrect";
          } else if (isSubmitted) {
            if (isCorrectOpt) extraClass = "correct";
          } else if (isSelected) {
            extraClass = "selected";
          }

          // 🛠️ ใช้ option_text หรือ text ก็ได้ รองรับทั้งสองรูปแบบจาก API
          const optLabel = opt.option_text || opt.text || "ไม่มีข้อความ";
          return `
          <div class="option-item ${extraClass}" data-q-id="${question._id}" data-opt-id="${opt._id}">
            <div class="option-radio"></div>
            <span>${optLabel}</span>
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

// ===== แจ้งเตือนเมื่อพยายามออกจากหน้าทำข้อสอบ =====
function setupLeaveWarning() {
  // 1. beforeunload: ปิดแท็บ / refresh / พิมพ์ URL ใหม่
  window.addEventListener("beforeunload", (e) => {
    if (examState.isSubmitted) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // 2. ดักลิงก์ในหน้า (เช่น ปุ่ม "← กลับ" ใน Navbar)
  document.addEventListener("click", (e) => {
    if (examState.isSubmitted) return;
    const link = e.target.closest("a[href]");
    if (!link) return;
    // ไม่ดักลิงก์ภายใน exam-room เอง
    if (link.closest("#quiz-content")) return;
    e.preventDefault();
    showLeaveConfirmModal(link.href);
  });

  // 3. ดัก popstate (ปุ่ม Back ของเบราว์เซอร์)
  window.addEventListener("popstate", (e) => {
    if (examState.isSubmitted) return;
    history.pushState(null, "", location.href);
    showLeaveConfirmModal("exam-list.html");
  });
  history.pushState(null, "", location.href);
}

// ===== Modal ยืนยันออกจากหน้าข้อสอบ =====
function showLeaveConfirmModal(targetUrl) {
  const existing = document.getElementById("leave-confirm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "leave-confirm-modal";
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal-content" style="position:relative; max-width:400px; text-align:center;">
      <h3 style="font-size:1.125rem; font-weight:700; margin-bottom:0.75rem;">คุณกำลังทำข้อสอบอยู่</h3>
      <p style="font-size:0.875rem; color:var(--color-gray-500); margin-bottom:1.5rem; line-height:1.6;">
        ถ้าออกจากหน้านี้ คำตอบจะ<strong>ไม่ถูกบันทึก</strong><br/>ต้องการออกหรือไม่?
      </p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-outline" id="leave-cancel" style="flex:1;">ยกเลิก</button>
        <button class="btn btn-primary" id="leave-confirm" style="flex:1;">ตกลง</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document
    .getElementById("leave-cancel")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.getElementById("leave-confirm").addEventListener("click", () => {
    examState.isSubmitted = true;
    stopTimer();
    window.location.href = targetUrl;
  });
}

// ===== ส่งข้อสอบ =====
function confirmSubmit() {
  const unanswered =
    examState.exam.questions.length - Object.keys(examState.answers).length;

  const modal = document.getElementById("submit-modal");
  const icon = document.getElementById("submit-modal-icon");
  const title = document.getElementById("submit-modal-title");
  const message = document.getElementById("submit-modal-message");

  if (unanswered > 0) {
    icon.textContent = "⚠️";
    title.textContent = "คุณยังทำไม่ครบ";
    message.innerHTML = `ยังมี <strong>${unanswered} ข้อ</strong> ที่ยังไม่ได้ตอบ<br/>ต้องการจะส่งข้อสอบใช่ไหม?`;
  } else {
    icon.textContent = "📝";
    title.textContent = "ยืนยันส่งข้อสอบ";
    message.textContent = "ตอบครบทุกข้อแล้ว ต้องการส่งข้อสอบหรือไม่?";
  }

  modal.style.display = "flex";

  const closeModal = () => { modal.style.display = "none"; };
  document.getElementById("submit-modal-close").onclick = closeModal;
  document.getElementById("submit-modal-cancel").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); }, { once: true });
  document.getElementById("submit-modal-confirm").onclick = async () => {
    closeModal();
    await doSubmit();
  };
}

async function autoSubmit() {
  const modal = document.getElementById("submit-modal");
  const icon = document.getElementById("submit-modal-icon");
  const title = document.getElementById("submit-modal-title");
  const message = document.getElementById("submit-modal-message");

  icon.textContent = "⏰";
  title.textContent = "หมดเวลา!";
  message.textContent = "ระบบจะส่งข้อสอบโดยอัตโนมัติ";
  document.getElementById("submit-modal-cancel").style.display = "none";
  document.getElementById("submit-modal-confirm").textContent = "ตกลง";
  modal.style.display = "flex";

  document.getElementById("submit-modal-confirm").onclick = async () => {
    modal.style.display = "none";
    document.getElementById("submit-modal-cancel").style.display = "";
    document.getElementById("submit-modal-confirm").textContent = "ส่งข้อสอบ";
    await doSubmit();
  };
}

async function doSubmit() {
  stopTimer();

  try {
    const result = await submitExamAnswers();
    examState.isSubmitted = true;
    examState.result = result;
    renderResult(result);
  } catch (err) {
    // 🛠️ แสดง error ใน modal แทน alert
    const modal = document.getElementById("submit-modal");
    const icon = document.getElementById("submit-modal-icon");
    const title = document.getElementById("submit-modal-title");
    const message = document.getElementById("submit-modal-message");

    icon.textContent = "❌";
    title.textContent = "ส่งข้อสอบไม่สำเร็จ";
    message.textContent = err.message;
    document.getElementById("submit-modal-cancel").style.display = "none";
    document.getElementById("submit-modal-confirm").textContent = "ตกลง";
    modal.style.display = "flex";

    document.getElementById("submit-modal-confirm").onclick = () => {
      modal.style.display = "none";
      document.getElementById("submit-modal-cancel").style.display = "";
      document.getElementById("submit-modal-confirm").textContent = "ส่งข้อสอบ";
      startTimer();
    };
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

  // ===== แก้ไขเฉพาะช่วง render ตัวเลือกในฟังก์ชัน renderResult =====
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
            .map((opt, oi) => {
              let cls = "";

              // 🛠️ correct_answer เป็นตัวอักษร A/B/C/D -> แปลงเป็น index เพื่อเทียบกับตำแหน่ง option
              const correctIndex = detail.correct_answer
                ? String(detail.correct_answer).trim().charCodeAt(0) - 65
                : -1;
              const isCorrectOpt = oi === correctIndex;

              // 🛠️ user_answer เก็บเป็น UUID -> เทียบกับ opt._id
              const currentOptId = String(opt._id).trim();
              const userAnsId = detail.user_answer
                ? String(detail.user_answer).trim()
                : "";

              if (isCorrectOpt) {
                cls = "correct";
              } else if (currentOptId === userAnsId && !detail.is_correct) {
                cls = "incorrect";
              }

              const optLabel = opt.text || opt.option_text || "ไม่มีข้อความคำตอบ";
              return `
                <div class="option-item ${cls}">
                  <div class="option-radio"></div>
                  <span>${optLabel}</span>
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
