// ============================================
// Main Module - หน้าแรก (index.html)
// โหลดสินค้า Featured และข้อสอบ Featured
// ============================================

// โหลดสินค้า featured (4 ชิ้นแรก)
async function loadFeaturedProducts() {
  const container = document.getElementById("featured-products");
  try {
    const products = await fetchProducts();
    const featured = products.slice(0, 4);
    renderProducts(featured, "featured-products");
  } catch (err) {
    container.innerHTML =
      '<div class="loading-overlay" style="grid-column:1/-1;">ไม่สามารถโหลดข้อมูลได้</div>';
  }
}

// โหลดข้อสอบ featured (3 ชุดแรก)
async function loadFeaturedExams() {
  const container = document.getElementById("featured-exams");
  try {
    const exams = await fetchExams();
    const featured = exams.slice(0, 3);
    container.innerHTML = featured
      .map(
        (exam) => `
      <div class="exam-card">
        <div class="exam-card-category">${exam.category || "ทั่วไป"}</div>
        <h3 class="exam-card-title">${exam.exam_name}</h3>
        <p class="exam-card-desc">${exam.description}</p>
        <div class="exam-card-meta">
          <span>📝 ${exam.question_count} ข้อ</span>
          <span>⏱ ${exam.time_limit_minutes} นาที</span>
        </div>
        <a href="exam-list.html" class="btn btn-primary" style="width:100%;">ดูรายละเอียด</a>
      </div>
    `,
      )
      .join("");
  } catch {
    container.innerHTML =
      '<div class="loading-overlay" style="grid-column:1/-1;">ไม่สามารถโหลดข้อมูลได้</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 📌 ตั้งค่า Navbar และ Cart Badge สำหรับหน้าแรก
  // (product.js initProductPage จะ return early เพราะไม่มี #product-grid)
  setupNavbar();
  updateCartCount();

  loadFeaturedProducts();
  loadFeaturedExams();
});
