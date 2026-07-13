// ============================================
// Order Module - ประวัติสั่งซื้อ, รายละเอียด, สถานะ
// ============================================

window.API_BASE = window.API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token"); // 👈 ตรวจสอบชื่อ Key ให้ตรงกับตอนที่คุณบันทึกสั่ง Login สำเร็จ
}

// ===== ดึงประวัติออเดอร์ของผู้ใช้ =====
async function fetchMyOrders() {
  const response = await fetch(`${API_BASE}/orders`, {
    // 🛠️ แก้ไขบรรทัดนี้มาดึงคีย์ accessToken ตรงๆ
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  if (!response.ok) throw new Error("ดึงประวัติไม่สำเร็จ");
  return await response.json();
}
// ===== ดึงรายละเอียดออเดอร์ตาม ID =====
async function fetchOrderById(orderId) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    // 🛠️ แก้ไขบรรทัดนี้ด้วยเช่นกันครับ
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  if (!response.ok) throw new Error("ไม่พบออเดอร์");
  return await response.json();
}

// ===== แสดงรายการออเดอร์แบบ Card List =====
function renderOrders(orders) {
  const container = document.getElementById("order-list");
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>ยังไม่มีประวัติสั่งซื้อ</h2>
        <p>เริ่มช้อปสินค้าได้เลย!</p>
        <a href="product.html" class="btn btn-primary" style="margin-top:1rem;">ดูสินค้า</a>
      </div>`;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      // 🛠️ แก้ไขจุดที่ 1: ดักจับราคารวม (เผื่อหลังบ้านใช้ total_amount, totalPrice หรือ total)
      const rawTotal =
        order.total_amount || order.totalPrice || order.total || 0;
      const totalAmount = isNaN(parseFloat(rawTotal))
        ? 0
        : parseFloat(rawTotal);

      const date = new Date(
        order.order_date || order.createdAt,
      ).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const status = order.order_status || "pending";

      // แสดงสินค้าแต่ละรายการ
      const itemsHTML = (order.order_details || [])
        .map((item) => {
          // 🛠️ แก้ไขจุดที่ 2: ดักจับราคาสินค้าต่อชิ้น (เผื่อหลังบ้านใช้ price_at_purchase หรือ price)
          const rawPrice = item.price_at_purchase || item.price || 0;
          const itemPrice = isNaN(parseFloat(rawPrice))
            ? 0
            : parseFloat(rawPrice);

          const qty = parseInt(item.quantity) || 1;

          return `
          <div class="order-card-item">
            <div class="order-card-item-img">
              <img src="${getProductImage(item.product_id)}" alt="${item.product_name}" />
            </div>
            <div class="order-card-item-info">
              <div class="order-card-item-name">${item.product_name}</div>
              <div class="order-card-item-qty">x${qty} · ฿${(itemPrice * qty).toLocaleString()}</div>
            </div>
          </div>`;
        })
        .join("");

      return `
      <div class="order-card" data-order-id="${order._id}">
        <div class="order-card-top">
          <span class="order-card-id">#${order._id.slice(0, 8)}...</span>
          <span class="order-card-date">${date}</span>
        </div>
        <div class="order-card-items">${itemsHTML}</div>
        <div class="order-card-bottom">
          <span class="order-card-total">รวม ฿${totalAmount.toLocaleString()}</span>
          <span class="order-status-badge status-${status}">${getStatusLabel(status)}</span>
        </div>
      </div>`;
    })
    .join("");

  // ผูก Event: กดที่การ์ดเพื่อดูรายละเอียด
  container.addEventListener("click", (e) => {
    const card = e.target.closest(".order-card");
    if (card) {
      const orderId = card.getAttribute("data-order-id");
      showOrderDetailModal(orderId);
    }
  });
}

// ===== แสดง Modal รายละเอียดออเดอร์ =====
async function showOrderDetailModal(orderId) {
  const modal = document.getElementById("order-detail-modal");
  const body = document.getElementById("order-modal-body");
  if (!modal || !body) return;

  // แสดง loading
  body.innerHTML =
    '<div style="text-align:center; padding:2rem;"><span class="spinner"></span></div>';
  modal.style.display = "flex";

  try {
    const order = await fetchOrderById(orderId);
    const totalAmount = order.total_amount
      ? parseFloat(order.total_amount.toString())
      : 0;
    const date = new Date(
      order.order_date || order.createdAt,
    ).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const status = order.order_status || "pending";

    // Timeline สถานะจัดส่ง
    const timelineHTML = buildStatusTimeline(status);

    // รายการสินค้า
    const itemsHTML = (order.order_details || [])
      .map((item) => {
        const itemPrice = item.price_at_purchase
          ? parseFloat(item.price_at_purchase.toString())
          : 0;
        return `
        <div class="order-detail-item">
          <img src="${getProductImage(item.product_id)}" alt="${item.product_name}" />
          <div class="order-detail-item-info">
            <div class="order-detail-item-name">${item.product_name}</div>
            <div class="order-detail-item-qty">x${item.quantity} · ฿${(itemPrice * item.quantity).toLocaleString()}</div>
          </div>
        </div>`;
      })
      .join("");

    body.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h2 style="font-size:1.125rem; font-weight:700;">ออเดอร์ #${order._id.slice(0, 8)}...</h2>
          <span class="order-status-badge status-${status}">${getStatusLabel(status)}</span>
        </div>
        <p style="font-size:0.8rem; color:var(--color-gray-500);">${date}</p>
      </div>

      <!-- Timeline สถานะ -->
      <div style="margin-bottom:1.5rem;">
        <h3 style="font-size:0.875rem; font-weight:600; margin-bottom:0.75rem;">สถานะการจัดส่ง</h3>
        ${timelineHTML}
      </div>

      <!-- รายการสินค้า -->
      <div style="margin-bottom:1.5rem;">
        <h3 style="font-size:0.875rem; font-weight:600; margin-bottom:0.75rem;">รายการสินค้า</h3>
        ${itemsHTML}
      </div>

      <!-- ที่อยู่จัดส่ง + ยอดรวม -->
      <div style="border-top:1px solid var(--color-border-light); padding-top:1rem;">
        <div style="font-size:0.8rem; color:var(--color-gray-500); margin-bottom:0.5rem;">
          <strong>ที่อยู่จัดส่ง:</strong> ${order.shipping_address || "-"}
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1rem;">
          <span>ยอดรวม</span>
          <span>฿${totalAmount.toLocaleString()}</span>
        </div>
      </div>`;

    // ปิด modal
    document.getElementById("order-modal-close").onclick = () => {
      modal.style.display = "none";
    };
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  } catch (err) {
    body.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--color-error);">${err.message}</div>`;
  }
}

// ===== สร้าง Timeline สถานะจัดส่ง =====
function buildStatusTimeline(currentStatus) {
  const steps = [
    { key: "pending", label: "รอชำระเงิน", icon: "⏳" },
    { key: "paid", label: "ชำระแล้ว", icon: "💳" },
    { key: "shipped", label: "กำลังจัดส่ง", icon: "🚚" },
    { key: "delivered", label: "จัดส่งสำเร็จ", icon: "✅" },
  ];
  // cancelled ไม่อยู่ใน timeline ปกติ

  if (currentStatus === "cancelled") {
    return `
      <div style="display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1rem; background:#fef2f2; border-left:3px solid var(--color-error);">
        <span>❌</span>
        <span style="font-size:0.875rem; font-weight:600; color:#991b1b;">ออเดอร์นี้ถูกยกเลิก</span>
      </div>`;
  }

  const currentIdx = steps.findIndex((s) => s.key === currentStatus);
  if (currentIdx === -1) return "";

  return `
    <div class="order-timeline">
      ${steps
        .map((step, i) => {
          const isDone = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return `
          <div class="timeline-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}">
            <div class="timeline-dot">${step.icon}</div>
            <div class="timeline-label">${step.label}</div>
            ${i < steps.length - 1 ? '<div class="timeline-line"></div>' : ""}
          </div>`;
        })
        .join("")}
    </div>`;
}

// ===== แปลงสถานะเป็นภาษาไทย =====
function getStatusLabel(status) {
  const labels = {
    pending: "รอชำระเงิน",
    paid: "ชำระแล้ว",
    shipped: "กำลังจัดส่ง",
    delivered: "จัดส่งสำเร็จ",
    cancelled: "ยกเลิก",
  };
  return labels[status] || status;
}

// ===== ดึงรูปสินค้า ( fallback ถ้าไม่มี product image ใน order_details) =====
function getProductImage(productId) {
  // order_details ไม่มีรูป ใช้ placeholder
  return "https://placehold.co/80x80?text=Sheet";
}

// ===== เริ่มต้นหน้า Order History =====
async function initOrderPage() {
  if (!requireAuth()) return;
  setupNavbar();
  updateCartCount();

  const container = document.getElementById("order-list");
  if (!container) return;

  container.innerHTML =
    '<div class="loading-overlay"><span class="spinner"></span> กำลังโหลด...</div>';

  try {
    const orders = await fetchMyOrders();
    renderOrders(orders);
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--color-error);">${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("order-list")) {
    initOrderPage();
  }
});
