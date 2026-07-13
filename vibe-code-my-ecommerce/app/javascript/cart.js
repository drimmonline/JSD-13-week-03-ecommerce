// ============================================
// Cart Module - จัดการตะกร้าสินค้า + Checkout + QR Payment
// ============================================

window.API_BASE = window.API_BASE || "http://localhost:3000/api";

// ===== ดึงตะกร้าสินค้าจาก API =====
async function fetchCart() {
  const response = await fetch(`${API_BASE}/carts`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("ดึงตะกร้าไม่สำเร็จ");
  return await response.json();
}

// ===== แสดงตะกร้าสินค้า =====
function renderCart(cart) {
  const container = document.getElementById("cart-items");
  const summaryEl = document.getElementById("cart-summary");
  const emptyEl = document.getElementById("cart-empty");

  if (!container) return;

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    if (summaryEl) summaryEl.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summaryEl) summaryEl.style.display = "block";

  container.innerHTML = cart.items
    .map((item) => {
      const p = item.product;
      if (!p) return "";
      return `
      <div class="cart-item" data-product-id="${item.product_id}">
        <img src="${p.product_image}" alt="${p.product_name}" class="cart-item-image" />
        <div class="cart-item-info">
          <div class="cart-item-name">${p.product_name}</div>
          <div class="cart-item-price">฿${p.product_price.toLocaleString()}</div>
        </div>
        <div class="cart-item-actions">
          <button class="btn btn-sm btn-outline btn-qty-minus" data-product-id="${item.product_id}">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10"
            data-product-id="${item.product_id}" />
          <button class="btn btn-sm btn-outline btn-qty-plus" data-product-id="${item.product_id}">+</button>
        </div>
        <button class="cart-item-remove btn-remove-item" data-product-id="${item.product_id}" title="ลบ">✕</button>
      </div>`;
    })
    .join("");

  // คำนวณยอดรวม
  calculateAndDisplayTotals(cart.items);
}

// ===== คำนวณและแสดงยอดรวม =====
function calculateAndDisplayTotals(items) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product?.product_price || 0) * item.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.07 * 100) / 100; // VAT 7%
  const grandTotal = subtotal + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const summaryEl = document.getElementById("cart-summary");
  if (summaryEl) {
    document.getElementById("subtotal").textContent =
      `฿${subtotal.toLocaleString()}`;
    document.getElementById("tax").textContent = `฿${tax.toLocaleString()}`;
    document.getElementById("grand-total").textContent =
      `฿${grandTotal.toLocaleString()}`;
    document.getElementById("total-items").textContent = `${totalItems} รายการ`;
  }
}

// ===== เปลี่ยนจำนวนสินค้า =====
async function changeQuantity(productId, newQty) {
  if (newQty < 1) {
    await removeItem(productId);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/carts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ product_id: productId, quantity: newQty }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.msg);
    }

    await loadCart();
    updateCartCount();
  } catch (err) {
    alert(err.message);
  }
}

// ===== ลบสินค้า =====
async function removeItem(productId) {
  try {
    const response = await fetch(`${API_BASE}/carts`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ product_id: productId }),
    });

    if (!response.ok) throw new Error("ลบไม่สำเร็จ");
    await loadCart();
    updateCartCount();
  } catch (err) {
    alert(err.message);
  }
}

// ===== ล้างตะกร้า =====
async function clearCart() {
  if (!confirm("ต้องการล้างตะกร้าทั้งหมดหรือไม่?")) return;

  try {
    await fetch(`${API_BASE}/carts/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await loadCart();
    updateCartCount();
  } catch {
    alert("ล้างตะกร้าไม่สำเร็จ");
  }
}

// ===== โหลดข้อมูลตะกร้า =====
async function loadCart() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  try {
    const cart = await fetchCart();
    renderCart(cart);
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--color-error);">${err.message}</div>`;
  }
}

// ===== Checkout: สั่งซื้อ =====
async function checkout() {
  const addressInput = document.getElementById("shipping-address");
  if (!addressInput || !addressInput.value.trim()) {
    alert("กรุณากรอกที่อยู่จัดส่ง");
    return;
  }

  const btn = document.getElementById("checkout-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> กำลังสั่งซื้อ...';
  }

  try {
    const response = await fetch(`${API_BASE}/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ shipping_address: addressInput.value.trim() }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.msg);

    // สร้าง QR Payment
    await initiatePayment(data.order._id);
  } catch (err) {
    alert(err.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "สั่งซื้อและชำระเงิน";
    }
  }
}

// ===== QR Payment =====
async function initiatePayment(orderId) {
  try {
    const response = await fetch(`${API_BASE}/payment/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.msg);

    showPaymentModal(data.payment);
    startPaymentStatusCheck(data.payment._id);
  } catch (err) {
    alert(err.message);
  }
}

function showPaymentModal(payment) {
  const modal = document.getElementById("payment-modal");
  if (!modal) return;

  document.getElementById("qr-image").src = payment.qr_code_url;
  document.getElementById("payment-amount").textContent =
    `฿${payment.amount.toLocaleString()}`;
  document.getElementById("payment-status").textContent = "รอการชำระเงิน...";
  document.getElementById("payment-txn-id").textContent =
    `Transaction: ${payment.transaction_id}`;
  modal.style.display = "flex";
}

function closePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "none";
}

// ===== ตรวจสอบสถานะ Payment แบบ Polling =====
let paymentCheckInterval = null;

function startPaymentStatusCheck(paymentId) {
  // ล้าง interval เก่า (ถ้ามี)
  if (paymentCheckInterval) clearInterval(paymentCheckInterval);

  paymentCheckInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE}/payment/status/${paymentId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) return;
      const data = await response.json();

      const statusEl = document.getElementById("payment-status");
      if (data.status === "successful") {
        clearInterval(paymentCheckInterval);
        if (statusEl) statusEl.textContent = "ชำระเงินสำเร็จ!";
        alert("ชำระเงินสำเร็จ! ขอบคุณสำหรับการสั่งซื้อ");
        closePaymentModal();
        window.location.href = "index.html";
      } else if (data.status === "failed") {
        clearInterval(paymentCheckInterval);
        if (statusEl) statusEl.textContent = "การชำระเงินล้มเหลว";
        alert("การชำระเงินล้มเหลว กรุณาลองใหม่");
      }
    } catch {
      // ไม่ต้องแสดง error สำหรับ polling
    }
  }, 3000); // ตรวจสอบทุก 3 วินาที
}

// ===== เริ่มต้นหน้า Cart =====
async function initCartPage() {
  if (!requireAuth()) return;
  setupNavbar();
  updateCartCount();

  // 📌 Event delegation สำหรับปุ่ม +/-, input เปลี่ยนจำนวน, ปุ่มลบ (ป้องกัน CSP)
  const cartContainer = document.getElementById("cart-items");
  if (cartContainer) {
    cartContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-product-id]");
      if (!btn) return;
      const productId = btn.getAttribute("data-product-id");

      if (btn.classList.contains("btn-qty-minus")) {
        const input = cartContainer.querySelector(`.quantity-input[data-product-id="${productId}"]`);
        const currentQty = input ? parseInt(input.value) : 1;
        changeQuantity(productId, currentQty - 1);
      } else if (btn.classList.contains("btn-qty-plus")) {
        const input = cartContainer.querySelector(`.quantity-input[data-product-id="${productId}"]`);
        const currentQty = input ? parseInt(input.value) : 1;
        changeQuantity(productId, currentQty + 1);
      } else if (btn.classList.contains("btn-remove-item")) {
        removeItem(productId);
      }
    });

    cartContainer.addEventListener("change", (e) => {
      if (e.target.classList.contains("quantity-input")) {
        const productId = e.target.getAttribute("data-product-id");
        const newQty = parseInt(e.target.value);
        if (productId && !isNaN(newQty)) {
          changeQuantity(productId, newQty);
        }
      }
    });
  }

  // 📌 Event listeners สำหรับปุ่มหลัก (ป้องกัน CSP - ไม่ใช้ inline onclick)
  const clearBtn = document.getElementById("clear-cart-btn");
  if (clearBtn) clearBtn.addEventListener("click", clearCart);

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

  // 📌 Modal: ปิดเมื่อกด backdrop หรือปุ่มปิด
  const modal = document.getElementById("payment-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePaymentModal();
    });
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closePaymentModal);
  }

  await loadCart();
}

// เริ่มต้นเมื่อโหลดหน้า
document.addEventListener("DOMContentLoaded", () => {
  // ถ้าอยู่ในหน้า cart.html
  if (document.getElementById("cart-items")) {
    initCartPage();
  }
});
