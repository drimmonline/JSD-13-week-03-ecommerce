// ============================================
// Admin Module - จัดการระบบ, CRUD สินค้า/ข้อสอบ, สรุปยอดขาย
// ============================================

const ADMIN_API = "http://localhost:3000/api";

// ===== State =====
let currentRange = "daily";
let questionsData = [];

// ===== Helpers =====
function adminToken() {
  return localStorage.getItem("accessToken");
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken()}`,
  };
}

function parseDecimal(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (typeof val === "object" && val.$numberDecimal) {
    return parseFloat(val.$numberDecimal) || 0;
  }
  return 0;
}

// ===== ตรวจสอบสิทธิ์ Admin =====
function requireAdmin() {
  const user = getUser();
  if (!user || user.account_type !== "admin") {
    alert("ไม่มีสิทธิ์เข้าถึงหน้านี้");
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// ===== Sidebar Navigation =====
function setupSidebar() {
  const navItems = document.querySelectorAll(".admin-nav-item[data-section]");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.getAttribute("data-section");
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
      const target = document.getElementById(`section-${section}`);
      if (target) target.classList.add("active");
      if (section === "dashboard") loadDashboard();
      if (section === "products") loadProductsTable();
      if (section === "exams") loadExamsTable();
    });
  });
}

// ============================================================
// Dashboard
// ============================================================

async function loadDashboard() {
  try {
    const [ordersRes, productsRes, usersRes] = await Promise.all([
      fetch(`${ADMIN_API}/orders/all`, { headers: adminHeaders() }),
      fetch(`${ADMIN_API}/products`),
      fetch(`${ADMIN_API}/users`, { headers: adminHeaders() }),
    ]);

    const orders = ordersRes.ok ? await ordersRes.json() : [];
    const products = productsRes.ok ? await productsRes.json() : [];
    const users = usersRes.ok ? await usersRes.json() : [];

    const filtered = filterOrdersByRange(orders, currentRange);

    let totalRevenue = 0;
    filtered.forEach((o) => { totalRevenue += parseDecimal(o.total_amount); });

    document.getElementById("total-revenue").textContent = `฿${totalRevenue.toLocaleString()}`;
    document.getElementById("total-orders").textContent = filtered.length;
    document.getElementById("total-products").textContent = Array.isArray(products) ? products.length : 0;
    document.getElementById("total-users").textContent = Array.isArray(users) ? users.length : 0;

    renderTopProducts(filtered, products);
    renderRecentOrders(filtered.slice(0, 10));
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function filterOrdersByRange(orders, range) {
  const now = new Date();
  let cutoff;
  if (range === "daily") {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "weekly") {
    cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
  } else if (range === "monthly") {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    return orders;
  }
  return orders.filter((o) => new Date(o.order_date || o.createdAt) >= cutoff);
}

function renderTopProducts(orders, products = []) {
  const container = document.getElementById("top-products-list");
  if (!container) return;

  // 🛠️ สร้าง map จาก product_id -> product_image เพื่อดึงรูปสินค้ามาแสดง
  const imageMap = {};
  (Array.isArray(products) ? products : []).forEach((p) => {
    imageMap[p._id] = p.product_image || "";
  });

  const productMap = {};
  orders.forEach((order) => {
    (order.order_details || []).forEach((item) => {
      const id = item.product_id;
      if (!productMap[id]) {
        productMap[id] = { product_id: id, product_name: item.product_name, totalQty: 0, totalRevenue: 0 };
      }
      productMap[id].totalQty += item.quantity;
      productMap[id].totalRevenue += parseDecimal(item.price_at_purchase) * item.quantity;
    });
  });
  const sorted = Object.values(productMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);
  if (sorted.length === 0) {
    container.innerHTML = '<div class="admin-empty">ยังไม่มีข้อมูลยอดขาย</div>';
    return;
  }
  container.innerHTML = sorted.map((p, i) => {
    const img = imageMap[p.product_id] || "https://placehold.co/40x40?text=S";
    return `
    <div class="top-product-item">
      <div class="top-product-rank">#${i + 1}</div>
      <img class="top-product-img" src="${img}" alt="" />
      <div class="top-product-info">
        <div class="top-product-name">${p.product_name}</div>
        <div class="top-product-sales">ขายได้ ${p.totalQty} ชิ้น</div>
      </div>
      <div class="top-product-revenue">฿${p.totalRevenue.toLocaleString()}</div>
    </div>`;
  }).join("");
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recent-orders-list");
  if (!container) return;
  if (orders.length === 0) {
    container.innerHTML = '<div class="admin-empty">ยังไม่มีออเดอร์</div>';
    return;
  }
  container.innerHTML = orders.map((o) => {
    const total = parseDecimal(o.total_amount);
    const date = new Date(o.order_date || o.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const status = o.order_status || "pending";
    return `
      <div class="recent-order-item">
        <div class="recent-order-info">
          <div class="recent-order-id">#${o._id.slice(0, 8)}...</div>
          <div class="recent-order-date">${date}</div>
        </div>
        <span class="order-status-badge status-${status}">${getStatusLabel(status)}</span>
        <div class="recent-order-amount">฿${total.toLocaleString()}</div>
      </div>`;
  }).join("");
}

function getStatusLabel(status) {
  return { pending: "รอชำระเงิน", paid: "ชำระแล้ว", shipped: "กำลังจัดส่ง", delivered: "จัดส่งสำเร็จ", cancelled: "ยกเลิก" }[status] || status;
}

// ============================================================
// Filter Buttons
// ============================================================

function setupFilterButtons() {
  document.querySelectorAll(".filter-btn[data-range]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn[data-range]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentRange = btn.getAttribute("data-range");
      loadDashboard();
    });
  });
}

// ============================================================
// Products CRUD
// ============================================================

async function loadProductsTable() {
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;
  try {
    const res = await fetch(`${ADMIN_API}/products`);
    const products = await res.json();
    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">ยังไม่มีสินค้า</td></tr>';
      return;
    }
    tbody.innerHTML = products.map((p) => {
      const price = parseDecimal(p.product_price);
      return `
        <tr>
          <td><img class="admin-table-img" src="${p.product_image || "https://placehold.co/40x40"}" alt="" /></td>
          <td>${p.product_name}</td>
          <td>${p.category || "ทั่วไป"}</td>
          <td>฿${price.toLocaleString()}</td>
          <td>${p.stock_quantity}</td>
          <td>
            <div class="admin-table-actions">
              <button class="btn btn-sm btn-outline" data-action="edit-product" data-id="${p._id}">แก้ไข</button>
              <button class="btn btn-sm btn-danger" data-action="delete-product" data-id="${p._id}" data-name="${p.product_name}">ลบ</button>
            </div>
          </td>
        </tr>`;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--color-error);">${err.message}</td></tr>`;
  }
}

function openProductModal(product = null) {
  const modal = document.getElementById("product-modal");
  const title = document.getElementById("product-modal-title");
  const form = document.getElementById("product-form");
  form.reset();
  document.getElementById("pf-product-id").value = "";

  // Reset image preview
  const preview = document.getElementById("image-preview");
  const placeholder = document.getElementById("image-upload-placeholder");
  const uploadArea = document.getElementById("image-upload-area");
  preview.style.display = "none";
  preview.src = "";
  placeholder.style.display = "flex";
  uploadArea.classList.remove("has-image");
  document.getElementById("pf-image").value = "";

  if (product) {
    title.textContent = "แก้ไขสินค้า";
    document.getElementById("pf-product-id").value = product._id;
    document.getElementById("pf-name").value = product.product_name || "";
    document.getElementById("pf-detail").value = product.product_detail || "";
    document.getElementById("pf-price").value = parseDecimal(product.product_price);
    document.getElementById("pf-stock").value = product.stock_quantity || 0;
    document.getElementById("pf-category").value = product.category || "";

    // แสดงรูปเดิม
    if (product.product_image) {
      document.getElementById("pf-image").value = product.product_image;
      preview.src = product.product_image;
      preview.style.display = "block";
      placeholder.style.display = "none";
      uploadArea.classList.add("has-image");
    }
  } else {
    title.textContent = "เพิ่มสินค้าใหม่";
  }
  modal.style.display = "flex";
}

function closeProductModal() {
  document.getElementById("product-modal").style.display = "none";
}

// ===== Image Upload → บีบอัด → Base64 =====
// บีบอัดรูปภาพผ่าน Canvas: ลดขนาดไม่เกิน 800px, JPEG quality 0.7
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // ลดขนาดถ้าเกิน 800px
        const MAX = 800;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height / width) * MAX);
            width = MAX;
          } else {
            width = Math.round((width / height) * MAX);
            height = MAX;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // บีบอัดเป็น JPEG คุณภาพ 0.7
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error("ไม่สามารถโหลดรูปได้"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.readAsDataURL(file);
  });
}

function setupImageUpload() {
  const uploadArea = document.getElementById("image-upload-area");
  const fileInput = document.getElementById("pf-image-file");
  const preview = document.getElementById("image-preview");
  const placeholder = document.getElementById("image-upload-placeholder");
  const hiddenInput = document.getElementById("pf-image");

  if (!uploadArea) return;

  // คลิกพื้นที่ → เปิด file dialog
  uploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  // เลือกไฟล์ → บีบอัด → แสดง preview
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("ไฟล์รูปต้องมีขนาดไม่เกิน 10MB");
      fileInput.value = "";
      return;
    }

    try {
      const compressed = await compressImage(file);
      hiddenInput.value = compressed;
      preview.src = compressed;
      preview.style.display = "block";
      placeholder.style.display = "none";
      uploadArea.classList.add("has-image");
    } catch (err) {
      alert("บีบอัดรูปไม่สำเร็จ: " + err.message);
    }
  });

  // ลากวาง
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "var(--color-gray-500)";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event("change"));
    }
  });
}

// ส่งฟอร์มสินค้า
async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("pf-product-id").value;
  const data = {
    product_name: document.getElementById("pf-name").value.trim(),
    product_detail: document.getElementById("pf-detail").value.trim(),
    product_price: parseFloat(document.getElementById("pf-price").value) || 0,
    stock_quantity: parseInt(document.getElementById("pf-stock").value) || 0,
    product_image: document.getElementById("pf-image").value.trim(),
    category: document.getElementById("pf-category").value.trim() || "ทั่วไป",
  };
  try {
    const url = id ? `${ADMIN_API}/products/${id}` : `${ADMIN_API}/products`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: adminHeaders(), body: JSON.stringify(data) });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.msg || "บันทึกไม่สำเร็จ");
    }
    closeProductModal();
    loadProductsTable();
  } catch (err) {
    alert(err.message);
  }
}

// ============================================================
// Exams CRUD
// ============================================================

// ===== UUID Generator (browser-compatible) =====
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function loadExamsTable() {
  const tbody = document.getElementById("exams-tbody");
  if (!tbody) return;
  try {
    const res = await fetch(`${ADMIN_API}/exams`);
    const exams = await res.json();
    if (exams.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">ยังไม่มีข้อสอบ</td></tr>';
      return;
    }
    tbody.innerHTML = exams.map((ex) => `
      <tr>
        <td>${ex.exam_name}</td>
        <td>${ex.category || "ทั่วไป"}</td>
        <td>${ex.question_count || 0}</td>
        <td>${ex.time_limit_minutes}</td>
        <td>
          <div class="admin-table-actions">
            <button class="btn btn-sm btn-outline" data-action="edit-exam" data-id="${ex._id}">แก้ไข</button>
            <button class="btn btn-sm btn-danger" data-action="delete-exam" data-id="${ex._id}" data-name="${ex.exam_name}">ลบ</button>
          </div>
        </td>
      </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--color-error);">${err.message}</td></tr>`;
  }
}

function openExamModal(exam = null) {
  const modal = document.getElementById("exam-modal");
  const title = document.getElementById("exam-modal-title");
  const form = document.getElementById("exam-form");
  form.reset();
  document.getElementById("ef-exam-id").value = "";
  questionsData = [];
  document.getElementById("questions-container").innerHTML = "";

  if (exam) {
    title.textContent = "แก้ไขข้อสอบ";
    document.getElementById("ef-exam-id").value = exam._id;
    document.getElementById("ef-name").value = exam.exam_name || "";
    document.getElementById("ef-desc").value = exam.description || "";
    document.getElementById("ef-category").value = exam.category || "";
    document.getElementById("ef-time").value = exam.time_limit_minutes || 60;

    // โหลดคำถามเดิม - รักษา _id ทุกชั้น
    if (exam.questions && exam.questions.length > 0) {
      questionsData = exam.questions.map((q) => ({
        _id: q._id || generateUUID(),
        question_text: q.question_text || "",
        options: (q.options || []).map((o) => ({
          _id: o._id || generateUUID(),
          option_text: o.option_text || o.text || "",
        })),
        correct_option_id: q.correct_option_id || "A",
        explanation: q.explanation || "",
      }));
      renderQuestions();
    }
  } else {
    title.textContent = "เพิ่มข้อสอบใหม่";
    addEmptyQuestion();
  }
  modal.style.display = "flex";
}

function closeExamModal() {
  document.getElementById("exam-modal").style.display = "none";
}

async function handleExamSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("ef-exam-id").value;
  const data = {
    exam_name: document.getElementById("ef-name").value.trim(),
    description: document.getElementById("ef-desc").value.trim(),
    category: document.getElementById("ef-category").value.trim() || "ทั่วไป",
    time_limit_minutes: parseInt(document.getElementById("ef-time").value) || 60,
    questions: questionsData.map((q) => ({
      _id: q._id,
      question_text: q.question_text,
      options: q.options.map((o) => ({
        _id: o._id,
        option_text: o.option_text,
      })),
      correct_option_id: q.correct_option_id,
      explanation: q.explanation || "",
    })),
  };
  try {
    const url = id ? `${ADMIN_API}/exams/${id}` : `${ADMIN_API}/exams`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: adminHeaders(), body: JSON.stringify(data) });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.msg || "บันทึกไม่สำเร็จ");
    }
    closeExamModal();
    loadExamsTable();
  } catch (err) {
    alert(err.message);
  }
}

// ===== จัดการคำถาม Dynamic =====

function addEmptyQuestion() {
  const qId = generateUUID();
  questionsData.push({
    _id: qId,
    question_text: "",
    options: [
      { _id: generateUUID(), option_text: "" },
      { _id: generateUUID(), option_text: "" },
      { _id: generateUUID(), option_text: "" },
      { _id: generateUUID(), option_text: "" },
    ],
    correct_option_id: "A",
    explanation: "",
  });
  renderQuestions();
}

function renderQuestions() {
  const container = document.getElementById("questions-container");
  if (!container) return;
  container.innerHTML = questionsData.map((q, qi) => {
    const opts = q.options || [];
    return `
      <div class="question-card">
        <div class="question-card-header">
          <span>ข้อ ${qi + 1}</span>
          <button type="button" class="btn-remove-question" data-action="remove-question" data-qi="${qi}">✕</button>
        </div>
        <div class="form-group">
          <label>โจทย์</label>
          <input type="text" value="${escapeHtml(q.question_text)}" data-action="update-question" data-qi="${qi}" data-field="question_text" />
        </div>
        <div class="question-options">
          ${opts.map((o, oi) => `
            <div class="form-group">
              <label>ตัวเลือก ${String.fromCharCode(65 + oi)}</label>
              <input type="text" value="${escapeHtml(o.option_text)}" data-action="update-option" data-qi="${qi}" data-oi="${oi}" />
            </div>`).join("")}
        </div>
        <div class="question-correct">
          <label>คำตอบที่ถูก</label>
          <select data-action="update-question" data-qi="${qi}" data-field="correct_option_id">
            ${opts.map((o, oi) => {
              const letter = String.fromCharCode(65 + oi);
              return `<option value="${letter}" ${q.correct_option_id === letter ? "selected" : ""}>${letter}</option>`;
            }).join("")}
          </select>
        </div>
        <div class="form-group" style="margin-top:0.5rem;">
          <label>คำอธิบาย (เฉลย)</label>
          <input type="text" value="${escapeHtml(q.explanation || "")}" data-action="update-question" data-qi="${qi}" data-field="explanation" />
        </div>
      </div>`;
  }).join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================
// Confirm Modal
// ============================================================

let confirmCallback = null;

function showConfirmModal(message, callback) {
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-modal").style.display = "flex";
  confirmCallback = callback;
}

function setupConfirmModal() {
  document.getElementById("confirm-ok").addEventListener("click", () => {
    document.getElementById("confirm-modal").style.display = "none";
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  });
  document.getElementById("confirm-cancel").addEventListener("click", () => {
    document.getElementById("confirm-modal").style.display = "none";
    confirmCallback = null;
  });
}

// ============================================================
// Event Delegation - จัดการทุก click ผ่าน data-action
// ============================================================

function setupEventDelegation() {
  // Products table
  const productsTbody = document.getElementById("products-tbody");
  if (productsTbody) {
    productsTbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");

      if (action === "edit-product") {
        try {
          const res = await fetch(`${ADMIN_API}/products/${id}`);
          const product = await res.json();
          openProductModal(product);
        } catch { alert("ไม่สามารถดึงข้อมูลสินค้าได้"); }
      }

      if (action === "delete-product") {
        const name = btn.getAttribute("data-name");
        showConfirmModal(`ลบสินค้า "${name}"?`, async () => {
          try {
            const res = await fetch(`${ADMIN_API}/products/${id}`, { method: "DELETE", headers: adminHeaders() });
            if (!res.ok) throw new Error("ลบไม่สำเร็จ");
            loadProductsTable();
          } catch (err) { alert(err.message); }
        });
      }
    });
  }

  // Exams table
  const examsTbody = document.getElementById("exams-tbody");
  if (examsTbody) {
    examsTbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");

      if (action === "edit-exam") {
        try {
          // 🛠️ ใช้ endpoint  admin ที่ส่ง data ครบทุก field (รวมเฉลย + คำตอบที่ถูก)
          const res = await fetch(`${ADMIN_API}/exams/admin/${id}`, { headers: adminHeaders() });
          const exam = await res.json();
          openExamModal(exam);
        } catch { alert("ไม่สามารถดึงข้อมูลข้อสอบได้"); }
      }

      if (action === "delete-exam") {
        const name = btn.getAttribute("data-name");
        showConfirmModal(`ลบข้อสอบ "${name}"?`, async () => {
          try {
            const res = await fetch(`${ADMIN_API}/exams/${id}`, { method: "DELETE", headers: adminHeaders() });
            if (!res.ok) throw new Error("ลบไม่สำเร็จ");
            loadExamsTable();
          } catch (err) { alert(err.message); }
        });
      }
    });
  }

  // Questions container (dynamic)
  const questionsContainer = document.getElementById("questions-container");
  if (questionsContainer) {
    questionsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.getAttribute("data-action") === "remove-question") {
        const qi = parseInt(btn.getAttribute("data-qi"));
        questionsData.splice(qi, 1);
        renderQuestions();
      }
    });

    questionsContainer.addEventListener("change", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const qi = parseInt(el.getAttribute("data-qi"));

      if (el.getAttribute("data-action") === "update-question") {
        const field = el.getAttribute("data-field");
        questionsData[qi][field] = el.value;
      }

      if (el.getAttribute("data-action") === "update-option") {
        const oi = parseInt(el.getAttribute("data-oi"));
        questionsData[qi].options[oi].option_text = el.value;
      }
    });
  }
}

// ============================================================
// Init
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAdmin()) return;
  setupNavbar();
  updateCartCount();

  setupSidebar();
  setupFilterButtons();
  setupConfirmModal();
  setupEventDelegation();
  setupImageUpload();

  // Product form
  document.getElementById("btn-add-product").addEventListener("click", () => openProductModal());
  document.getElementById("product-form").addEventListener("submit", handleProductSubmit);
  document.getElementById("product-modal-close").addEventListener("click", closeProductModal);
  document.getElementById("product-form-cancel").addEventListener("click", closeProductModal);

  // Exam form
  document.getElementById("btn-add-exam").addEventListener("click", () => openExamModal());
  document.getElementById("exam-form").addEventListener("submit", handleExamSubmit);
  document.getElementById("exam-modal-close").addEventListener("click", closeExamModal);
  document.getElementById("exam-form-cancel").addEventListener("click", closeExamModal);
  document.getElementById("btn-add-question").addEventListener("click", addEmptyQuestion);

  // ปิด modal เมื่อคลิก backdrop
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  });

  loadDashboard();
});
