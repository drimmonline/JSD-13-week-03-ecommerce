// ============================================
// Product Module - จัดการระบบสินค้า, สืบค้น, เรียงลำดับ, กรอง, Page
// ============================================

window.API_BASE = window.API_BASE || "http://localhost:3000/api";

// 🛠️ ฟังก์ชันดึง Token และตรวจสอบสถานะล็อกอินแบบปลอดภัย (ป้องกันตั๋วพัง)
function safeGetToken() {
  if (typeof getToken === "function") {
    const t = getToken();
    if (t && t !== "null" && t !== "undefined") return t;
  }
  const localToken = localStorage.getItem("accessToken");
  if (localToken && localToken !== "null" && localToken !== "undefined")
    return localToken;
  return null;
}

function safeIsLoggedIn() {
  if (typeof isLoggedIn === "function") {
    return isLoggedIn();
  }
  return !!safeGetToken();
}

// ===== ดึงรายการสินค้าทั้งหมด =====
async function fetchProducts() {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) throw new Error("ดึงข้อมูลสินค้าไม่สำเร็จ");
  return await response.json();
}

// ===== ดึงสินค้าตาม ID =====
async function fetchProductById(id) {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) throw new Error("ไม่พบสินค้า");
  return await response.json();
}

// ===== แสดงสินค้าแบบ Grid =====
function renderProducts(products, containerId = "product-grid") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--color-gray-500);">
        ไม่พบสินค้าที่ค้นหา
      </div>`;
    return;
  }

  container.innerHTML = products
    .map((p) => {
      const price =
        p.product_price !== undefined && p.product_price !== null
          ? p.product_price
          : 0;
      const formattedPrice = price.toLocaleString();

      return `
        <div class="product-card">
          <img src="${p.product_image || ""}" alt="${p.product_name || ""}" class="product-card-image" loading="lazy" />
          <div class="product-card-body">
            <div class="product-card-tags">
              <span class="badge-tag">#${p.category || "ทั่วไป"}</span>
            </div>
            <h3 class="product-card-title">${p.product_name || "ไม่มีชื่อสินค้า"}</h3>
            <p class="product-card-desc">${p.product_detail || ""}</p>
            <div class="product-card-footer">
              <span class="product-card-price">฿${formattedPrice}</span>
              ${renderStockBadge(p.stock_quantity || 0)}
            </div>
            <button class="btn btn-primary btn-sm btn-add-to-cart" style="width:100%; margin-top:0.75rem;"
              ${(p.stock_quantity || 0) <= 0 ? "disabled" : ""}
              data-id="${p._id}">
              ${(p.stock_quantity || 0) <= 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
            </button>
          </div>
        </div>`;
    })
    .join("");
}

// ===== แสดง Badge สถานะสต็อก =====
function renderStockBadge(stock) {
  if (stock > 0) {
    return `<span class="product-card-stock badge-tag badge-success">มีสินค้า (${stock})</span>`;
  }
  return `<span class="product-card-stock badge-tag badge-error">สินค้าหมด</span>`;
}

// ===== แสดงแท็กหมวดหมู่ตามชื่อสินค้า =====
function getCategoryTag(name) {
  const lowerName = name.toLowerCase();
  const tags = [];

  if (lowerName.includes("คณิต") || lowerName.includes("math"))
    tags.push("คณิตศาสตร์");
  if (
    lowerName.includes("อังกฤษ") ||
    lowerName.includes("english") ||
    lowerName.includes("ielts")
  )
    tags.push("ภาษาอังกฤษ");
  if (lowerName.includes("เคมี") || lowerName.includes("chemistry"))
    tags.push("เคมี");
  if (lowerName.includes("ชีว") || lowerName.includes("biology"))
    tags.push("ชีววิทยา");
  if (lowerName.includes("ฟิสิกส์") || lowerName.includes("physics"))
    tags.push("ฟิสิกส์");
  if (lowerName.includes("คอม") || lowerName.includes("computer"))
    tags.push("Computer Science");

  if (tags.length === 0) tags.push("ทั่วไป");

  return tags
    .map(
      (t) => `<span class="badge-tag" style="margin-right:4px;">#${t}</span>`,
    )
    .join("");
}

// ===== Guest Cart =====
function getGuestCart() {
  const data = localStorage.getItem("guestCart");
  return data ? JSON.parse(data) : [];
}

function saveGuestCart(cart) {
  localStorage.setItem("guestCart", JSON.stringify(cart));
}

function addToGuestCart(productId) {
  const cart = getGuestCart();
  const existing = cart.find((item) => item.product_id === productId);
  if (existing) {
    if (existing.quantity >= 10) return false;
    existing.quantity += 1;
  } else {
    cart.push({ product_id: productId, quantity: 1 });
  }
  saveGuestCart(cart);
  return true;
}

function getGuestCartCount() {
  return getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
}

// ===== เพิ่มลงตะกร้า =====
async function handleAddToCart(productId) {
  const btn = document.querySelector(
    `.btn-add-to-cart[data-id="${productId}"]`,
  );

  if (!safeIsLoggedIn()) {
    const added = addToGuestCart(productId);
    if (!added) {
      alert("จำกัดจำนวนสินค้าสูงสุด 10 ชิ้นต่อรายการ");
      return;
    }
    updateCartCount();
    animateAddToCart(btn, productId);
    return;
  }

  try {
    const token = safeGetToken();
    if (!token) throw new Error("ไม่พบสิทธิ์การล็อกอิน กรุณาเข้าสู่ระบบใหม่");

    const response = await fetch(`${API_BASE}/carts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || "เพิ่มลงตะกร้าไม่สำเร็จ");

    updateCartCount();
    animateAddToCart(btn, productId);
  } catch (err) {
    alert(err.message);
  }
}

// ===== Animation =====
function animateAddToCart(btn, productId) {
  if (!btn) return;

  const originalText = btn.textContent;
  btn.textContent = "✓ เพิ่มแล้ว";
  btn.disabled = true;
  btn.classList.add("btn-added");

  const cartIcon = document.querySelector(".cart-badge");
  if (cartIcon) {
    const btnRect = btn.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const dot = document.createElement("div");
    dot.className = "fly-to-cart-dot";
    dot.style.left = `${btnRect.left + btnRect.width / 2}px`;
    dot.style.top = `${btnRect.top}px`;
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.left = `${cartRect.left + cartRect.width / 2}px`;
      dot.style.top = `${cartRect.top + cartRect.height / 2}px`;
      dot.style.transform = "scale(0.3)";
      dot.style.opacity = "0";
    });

    setTimeout(() => {
      dot.remove();
      cartIcon.classList.add("cart-bounce");
      setTimeout(() => cartIcon.classList.remove("cart-bounce"), 500);
    }, 500);
  }

  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;
    btn.classList.remove("btn-added");
  }, 1200);
}

// ===== อัปเดต Badge จำนวนในตะกร้า =====
async function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  const token = safeGetToken();
  let count = 0;

  if (!safeIsLoggedIn() || !token) {
    count = getGuestCartCount();
  } else {
    try {
      const response = await fetch(`${API_BASE}/carts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403 || response.status === 401 || !response.ok) {
        count = getGuestCartCount();
      } else {
        const cart = await response.json();
        const serverCount = cart.items
          ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
          : 0;
        count = serverCount + getGuestCartCount();
      }
    } catch {
      count = getGuestCartCount();
    }
  }

  // 📌 ซ่อน badge เมื่อไม่มีสินค้า แสดงเลขเมื่อมีสินค้า
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = "";
  } else {
    badge.textContent = "";
    badge.style.display = "none";
  }
}

// ===== Cart Dropdown =====
function toggleCartDropdown() {
  const dropdown = document.getElementById("cart-dropdown");
  if (!dropdown) return;

  const isOpen = dropdown.classList.contains("show");
  if (isOpen) {
    closeCartDropdown();
  } else {
    renderCartDropdown();
    dropdown.classList.add("show");
  }
}

function closeCartDropdown() {
  const dropdown = document.getElementById("cart-dropdown");
  if (dropdown) dropdown.classList.remove("show");
}

// ===== แสดงตะกร้าสินค้าใน Dropdown =====
async function renderCartDropdown() {
  const dropdown = document.getElementById("cart-dropdown");
  if (!dropdown) return;

  const token = safeGetToken();

  if (!safeIsLoggedIn() || !token) {
    renderGuestCartDropdown(dropdown);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/carts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403 || response.status === 401) {
      renderGuestCartDropdown(dropdown);
      return;
    }

    if (!response.ok) throw new Error();
    const cart = await response.json();

    if (!cart.items || cart.items.length === 0) {
      renderEmptyDropdown(dropdown);
      return;
    }

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.product?.product_price || 0) * item.quantity;
    }, 0);

    dropdown.innerHTML = `
      <div class="cart-dropdown-header">
        <span>ตะกร้าสินค้า (${cart.items.length} รายการ)</span>
      </div>
      <div class="cart-dropdown-items">
        ${cart.items
          .map((item) => {
            const p = item.product;
            if (!p) return "";
            return `
          <div class="cart-dropdown-item">
            <img src="${p.product_image}" alt="${p.product_name}" />
            <div class="cart-dropdown-item-info">
              <div class="cart-dropdown-item-name">${p.product_name}</div>
              <div class="cart-dropdown-item-qty">x${item.quantity} · ฿${(p.product_price * item.quantity).toLocaleString()}</div>
            </div>
            <button class="cart-dropdown-item-remove" data-action="remove-server" data-product-id="${item.product_id}" title="ลบ">✕</button>
          </div>`;
          })
          .join("")}
      </div>
      <div class="cart-dropdown-footer">
        <div class="cart-dropdown-total">
          <span>รวมทั้งหมด</span>
          <span>฿${subtotal.toLocaleString()}</span>
        </div>
        <a href="cart.html" class="btn btn-primary btn-sm" style="width:100%; text-align:center;">ไปชำระเงิน</a>
      </div>`;
  } catch {
    renderEmptyDropdown(dropdown);
  }
}

// ===== แสดงตะกร้า Guest ใน Dropdown =====
function renderGuestCartDropdown(dropdown) {
  const guestCart = getGuestCart();

  if (guestCart.length === 0) {
    renderEmptyDropdown(dropdown);
    return;
  }

  const fetchItems = guestCart.map(async (item) => {
    try {
      const res = await fetch(`${API_BASE}/products/${item.product_id}`);
      if (!res.ok) return null;
      const product = await res.json();
      return { ...item, product };
    } catch {
      return null;
    }
  });

  Promise.all(fetchItems).then((results) => {
    const validItems = results.filter(Boolean);
    const subtotal = validItems.reduce((sum, item) => {
      return sum + (item.product?.product_price || 0) * item.quantity;
    }, 0);

    dropdown.innerHTML = `
      <div class="cart-dropdown-header">
        <span>ตะกร้าสินค้า (${validItems.length} รายการ)</span>
      </div>
      <div class="cart-dropdown-items">
        ${validItems
          .map((item) => {
            const p = item.product;
            return `
          <div class="cart-dropdown-item">
            <img src="${p.product_image}" alt="${p.product_name}" />
            <div class="cart-dropdown-item-info">
              <div class="cart-dropdown-item-name">${p.product_name}</div>
              <div class="cart-dropdown-item-qty">x${item.quantity} · ฿${(p.product_price * item.quantity).toLocaleString()}</div>
            </div>
            <button class="cart-dropdown-item-remove" data-action="remove-guest" data-product-id="${item.product_id}" title="ลบ">✕</button>
          </div>`;
          })
          .join("")}
      </div>
      <div class="cart-dropdown-footer">
        <div class="cart-dropdown-total">
          <span>รวมทั้งหมด</span>
          <span>฿${subtotal.toLocaleString()}</span>
        </div>
        <a href="auth.html" class="btn btn-primary btn-sm" style="width:100%; text-align:center;">เข้าสู่ระบบเพื่อชำระเงิน</a>
      </div>`;
  });
}

// ===== แสดงสถานะว่าง =====
function renderEmptyDropdown(dropdown) {
  dropdown.innerHTML = `
    <div class="cart-dropdown-empty">
      ตะกร้าว่างเปล่า
      <div style="margin-top:0.75rem;">
        <a href="product.html" class="btn btn-outline btn-sm">เลือกซื้อสินค้า</a>
      </div>
    </div>`;
}

// ===== ลบสินค้าจาก Dropdown (Logged-in) =====
async function removeCartItem(productId) {
  const token = safeGetToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/carts`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId }),
    });
    updateCartCount();
    renderCartDropdown();
  } catch {
    // ปิดเงียบ
  }
}

// ===== ลบสินค้าจาก Dropdown (Guest) =====
function removeGuestCartItem(productId) {
  let cart = getGuestCart();
  cart = cart.filter((item) => item.product_id !== productId);
  saveGuestCart(cart);
  updateCartCount();
  renderCartDropdown();
}

// ===== ตั้งค่า Cart Dropdown Events =====
function setupCartDropdown() {
  document.querySelectorAll(".cart-toggle").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCartDropdown();
    });
  });

  document.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-action]");
    if (!removeBtn) return;

    const action = removeBtn.getAttribute("data-action");
    const productId = removeBtn.getAttribute("data-product-id");

    if (action === "remove-server") {
      removeCartItem(productId);
    } else if (action === "remove-guest") {
      removeGuestCartItem(productId);
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cart-dropdown-wrapper")) {
      closeCartDropdown();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCartDropdown();
  });
}

document.addEventListener("DOMContentLoaded", setupCartDropdown);

// ===== กรองสินค้าตามคำค้นหา =====
function filterProducts(products, searchTerm) {
  if (!searchTerm) return products;
  const term = searchTerm.toLowerCase();
  return products.filter(
    (p) =>
      (p.product_name && p.product_name.toLowerCase().includes(term)) ||
      (p.product_detail && p.product_detail.toLowerCase().includes(term)),
  );
}

// ===== เรียงลำดับสินค้า =====
function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case "price-asc":
      sorted.sort((a, b) => (a.product_price || 0) - (b.product_price || 0));
      break;
    case "price-desc":
      sorted.sort((a, b) => (b.product_price || 0) - (a.product_price || 0));
      break;
    case "name-asc":
      sorted.sort((a, b) =>
        (a.product_name || "").localeCompare(b.product_name || ""),
      );
      break;
    case "newest":
      sorted.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
      break;
  }
  return sorted;
}

// ===== แสดงสินค้าแบบ Pagination =====
function paginateProducts(products, page, perPage = 8) {
  const totalPages = Math.ceil(products.length / perPage);
  const start = (page - 1) * perPage;
  const items = products.slice(start, start + perPage);
  return { items, totalPages, currentPage: page };
}

function renderPagination(totalPages, currentPage) {
  const container = document.getElementById("pagination");
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = "";
    return;
  }

  let html = "";
  html += `<button class="pagination-btn btn-page-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>ก่อนหน้า</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn btn-page-num ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="pagination-btn btn-page-nav" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>ถัดไป</button>`;

  container.innerHTML = html;
}

// ===== Product Page State =====
let allProducts = [];
let currentFilter = "";
let currentSort = "newest";
let currentPage = 1;

function setupProductEvents() {
  // 📌 ดักการคลิกปุ่ม "เพิ่มลงตะกร้า" ในทุก Grid (ใช้ได้ทั้ง product.html และ index.html)
  ["product-grid", "featured-products"].forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener("click", (e) => {
        const targetBtn = e.target.closest(".btn-add-to-cart");
        if (targetBtn) {
          const productId = targetBtn.getAttribute("data-id");
          handleAddToCart(productId);
        }
      });
    }
  });

  const paginationContainer = document.getElementById("pagination");
  if (paginationContainer) {
    paginationContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".pagination-btn");
      if (btn && !btn.hasAttribute("disabled")) {
        const pageIdx = parseInt(btn.getAttribute("data-page"), 10);
        if (pageIdx) goToPage(pageIdx);
      }
    });
  }
}

// ===== เริ่มต้นหน้าสินค้า =====
async function initProductPage() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML =
    '<div class="loading-overlay"><span class="spinner"></span> กำลังโหลด...</div>';

  try {
    setupProductEvents();
    allProducts = await fetchProducts();
    applyFiltersAndRender();
  } catch (err) {
    grid.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--color-error);">${err.message}</div>`;
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilter = e.target.value;
        currentPage = 1;
        applyFiltersAndRender();
      }, 300);
    });
  }

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  if (typeof setupNavbar === "function") setupNavbar();
  updateCartCount();
}

function applyFiltersAndRender() {
  let filtered = filterProducts(allProducts, currentFilter);
  filtered = sortProducts(filtered, currentSort);
  const { items, totalPages } = paginateProducts(filtered, currentPage);

  renderProducts(items);
  renderPagination(totalPages, currentPage);
}

function goToPage(page) {
  currentPage = page;
  applyFiltersAndRender();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", initProductPage);
