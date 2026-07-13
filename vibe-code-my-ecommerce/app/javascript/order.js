// ============================================
// Order Module - จัดการ Order, ประวัติสั่งซื้อ, สถานะ
// ============================================

window.API_BASE = window.API_BASE || "http://localhost:3000/api";

// ===== ดึงประวัติออเดอร์ของผู้ใช้ =====
async function fetchMyOrders() {
  const response = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("ดึงประวัติไม่สำเร็จ");
  return await response.json();
}

// ===== แสดงรายการออเดอร์ =====
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
      const totalAmount = order.total_amount ? parseFloat(order.total_amount.toString()) : 0;
      const itemCount = order.order_details ? order.order_details.length : 0;
      const itemsSummary = order.order_details
        ? order.order_details.map((d) => `${d.product_name} x${d.quantity}`).join(", ")
        : "";
      const date = new Date(order.order_date || order.createdAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-card-id">#${order._id.slice(0, 8)}...</span>
          <span>${date}</span>
        </div>
        <div class="order-card-items">${itemsSummary}</div>
        <div class="order-card-footer">
          <span class="order-card-total">฿${totalAmount.toLocaleString()}</span>
          <span class="order-status ${order.order_status}">${getStatusLabel(order.order_status)}</span>
        </div>
      </div>`;
    })
    .join("");
}

// ===== แปลงสถานะเป็นภาษาไทย =====
function getStatusLabel(status) {
  const labels = {
    pending: "รอชำระเงิน",
    paid: "ชำระแล้ว",
    shipped: "จัดส่งแล้ว",
    delivered: "ส่งสำเร็จ",
    cancelled: "ยกเลิก",
  };
  return labels[status] || status;
}

// ===== เริ่มต้นหน้า Order History =====
async function initOrderPage() {
  if (!requireAuth()) return;
  setupNavbar();
  updateCartCount();

  const container = document.getElementById("order-list");
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> กำลังโหลด...</div>';

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
