// ============================================
// Auth Module - จัดการฟอร์ม Login/Register + เก็บ Token
// ============================================

const API_BASE = "http://localhost:3000/api";

// ===== ตรวจสอบสถานะล็อกอินปัจจุบัน =====
function getToken() {
  return localStorage.getItem("accessToken");
}

function getUser() {
  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

function isLoggedIn() {
  return !!getToken();
}

// ===== สมัครสมาชิก =====
async function registerUser(username, password, profile = {}) {
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      profile,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || "สมัครสมาชิกไม่สำเร็จ");
  }
  return data;
}

// ===== เข้าสู่ระบบ =====
async function loginUser(username, password) {
  const response = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || "เข้าสู่ระบบไม่สำเร็จ");
  }

  // เก็บ Token และข้อมูลผู้ใช้ลง localStorage
  localStorage.setItem("accessToken", data.accessToken);

  // ถอดรหัส JWT เพื่อเก็บข้อมูลผู้ใช้ (.Payload)
  const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
  localStorage.setItem("user", JSON.stringify(payload));

  return data;
}

// ===== ออกจากระบบ =====
function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  window.location.href = "auth.html";
}

// 🛠️ แก้ไขจุดบกพร่อง: ดึงข้อมูล Guest Cart จาก localStorage โดยตรงแบบปลอดภัย ไม่ต้องใช้ฟังก์ชันภายนอก
function safeGetGuestCart() {
  try {
    const cart = localStorage.getItem("guestCart");
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

// ===== Sync Guest Cart ไป Server หลังล็อกอิน =====
async function syncGuestCartToServer() {
  const guestCart = safeGetGuestCart();
  if (!Array.isArray(guestCart) || guestCart.length === 0) return;

  const token = getToken();
  if (!token) return;

  try {
    for (const item of guestCart) {
      await fetch(`${API_BASE}/carts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: item.quantity,
        }),
      });
    }
    // ล้าง Guest cart หลัง sync สำเร็จ
    localStorage.removeItem("guestCart");
  } catch (err) {
    console.warn("ไม่สามารถซิงค์ตะกร้าสินค้าได้:", err);
  }
}

// ===== ตรวจสอบสิทธิ์ก่อนเข้าหน้าที่ต้องล็อกอิน =====
// บันทึก URL ที่ต้องการเข้าก่อน redirect ไปหน้า login
function requireAuth() {
  // 🛠️ เปลี่ยนมาเช็คคีย์ "accessToken" ให้ตรงกับในระบบ
  if (!localStorage.getItem("accessToken")) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// ===== ดึง URL ที่บันทึกไว้หลัง login สำเร็จ =====
function getRedirectAfterLogin() {
  const url = localStorage.getItem("redirectAfterLogin");
  localStorage.removeItem("redirectAfterLogin");
  return url || "index.html";
}

// ===== ดึงข้อมูลผู้ใช้ปัจจุบันจาก API =====
async function getCurrentUserProfile() {
  const user = getUser();
  if (!user) return null;

  const response = await fetch(`${API_BASE}/users/${user.userId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data;
}

// ===== ตั้งค่า Navbar ตามสถานะล็อกอิน =====
function setupNavbar() {
  const authNav = document.getElementById("auth-nav");

  if (!authNav) return;

  // 🛠️ แก้ไขตรงนี้: เปลี่ยนมาเช็ค accessToken ใน localStorage ตรงๆ
  const token = localStorage.getItem("accessToken");

  if (token) {
    // 🛠️ แก้ไขตรงนี้: ดึงข้อมูล user จาก localStorage มา parse เป็น object
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    authNav.innerHTML = `
      <div class="user-menu">
        <button class="btn btn-sm btn-outline" id="user-menu-btn">
          ${user?.username || user?.userId?.slice(0, 6) || "ผู้ใช้"}
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <a href="cart.html">ตะกร้าสินค้า</a>
          <a href="order-history.html">ประวัติสั่งซื้อ</a>
          <a href="exam-list.html">ทำข้อสอบ</a>
          <button id="logout-btn">ออกจากระบบ</button>
        </div>
      </div>
    `;

    const menuBtn = authNav.querySelector("#user-menu-btn");
    const logoutBtn = authNav.querySelector("#logout-btn");

    if (menuBtn) menuBtn.addEventListener("click", toggleUserDropdown);
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
  } else {
    authNav.innerHTML = `
      <a href="auth.html" class="btn btn-sm btn-primary">เข้าสู่ระบบ</a>
    `;
  }
}
function toggleUserDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

// ปิด dropdown เมื่อคลิกข้างนอก
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown");
  const menuBtn = e.target.closest(".user-menu");
  if (dropdown && !menuBtn) {
    dropdown.classList.remove("show");
  }
});

// ===== Auth Page Logic =====
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  setupAuthTabs();

  if (loginForm) {
    if (isLoggedIn()) {
      window.location.href = "index.html";
      return;
    }
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  setupNavbar();
});

// ===== ตั้งค่า Tabs ในหน้า Auth =====
function setupAuthTabs() {
  const tabs = document.querySelectorAll(".auth-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.tab;
      document.querySelectorAll(".auth-form").forEach((form) => {
        form.classList.remove("active");
      });
      const targetEl = document.getElementById(`${target}-form-container`);
      if (targetEl) targetEl.classList.add("active");
    });
  });
}

// ===== จัดการฟอร์ม Login =====
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button[type='submit']");
  const errorEl = document.getElementById("login-error");

  const username = form.username.value.trim();
  const password = form.password.value;

  if (!username || !password) {
    if (errorEl) {
      errorEl.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
      errorEl.style.display = "block";
    }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังเข้าสู่ระบบ...';

  try {
    await loginUser(username, password);
    await syncGuestCartToServer();

    // 🛠️ ปรับปรุง: ใช้ replace เพื่อล้าง State และรอยต่อหน้าเว็บให้สะอาดคมชัด
    // ไปยังหน้าที่บันทึกไว้ก่อน login (เช่น ประวัติสั่งซื้อ)
    window.location.replace(getRedirectAfterLogin());
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ";
  }
}

// ===== จัดการฟอร์ม Register =====
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button[type='submit']");
  const errorEl = document.getElementById("register-error");

  const username = form.username.value.trim();
  const password = form.password.value;
  const name = form.name?.value?.trim() || "";
  const email = form.email?.value?.trim() || "";

  if (!username || !password) {
    if (errorEl) {
      errorEl.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
      errorEl.style.display = "block";
    }
    return;
  }

  if (password.length < 6) {
    if (errorEl) {
      errorEl.textContent = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      errorEl.style.display = "block";
    }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังสมัครสมาชิก...';

  try {
    await registerUser(username, password, { name, email });
    await loginUser(username, password);
    await syncGuestCartToServer();

    // 🛠️ ปรับปรุง: หน่วงเวลาเสี้ยววินาทีเพื่อให้ข้อมูลลง localStorage ครบถ้วนก่อนย้ายหน้า ยับยั้งบั๊ก 403
    setTimeout(() => {
      window.location.replace(getRedirectAfterLogin());
    }, 50);
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
    btn.disabled = false;
    btn.textContent = "สมัครสมาชิก";
  }
}
