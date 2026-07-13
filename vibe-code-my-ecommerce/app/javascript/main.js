// ============================================
// Main Module - หน้าแรก (index.html)
// โหลดสินค้า Featured และข้อสอบ Featured
// ============================================

// โหลดสินค้าใหม่ล่าสุด (เรียงจากเวลาที่เพิ่ม 4 ชิ้นแรก)
async function loadNewestProducts() {
  const container = document.getElementById("newest-products");
  if (!container) return;
  try {
    const products = await fetchProducts();
    // 🛠️ เรียงจาก createdAt ใหม่ไปเก่า
    const sorted = products
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const newest = sorted.slice(0, 4);
    renderProducts(newest, "newest-products");
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
  setupNavbar();
  updateCartCount();
  setupProductEvents();

  loadNewestProducts();
  loadFeaturedExams();
});
