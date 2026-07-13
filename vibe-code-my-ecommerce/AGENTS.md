# Project Name: Ecommerce and Exam Test

## 1. Executive Summary (ภาพรวมโปรเจกต์)

- **Objective:** [เป็นโปรเจ็คecommerceขายชีทสรุปหรือหนังสือเรียนและนอกจากนี้ยังมีระบบทำข้อสอบและเฉลย]
- **Target Audience:** [นักเรียนนักศึกษา หรือ ผู้ใช้ที่ต้องการอ่านหนังสือไปสอบ]
- **Core Value:** [การหาเนื้อหาเรียนที่ตรงจุดเช่าต้องการสอบกพก็รู้เลยว่าต้องอ่านหัวข้ออะไรบ้าง]
  **The "Vibe" & Design Style**: [สไตล์และอารมณ์ของแอป Minimalist, Clean White]

## 🛠️ Tech Stack & Constraints

Please strictly use the following tech stack. Do not introduce other libraries unless explicitly approved.

- **Frontend**: HTML CSS BOOSTRAP5 JS Tailwind UI
- **UI Components**: shadcn/ui, Lucide React (Icons)
- **State Management**: Javascript dom
- **Database / Backend**: mongo db express
- **Strict Rules**:
  1. Use TypeScript for all files. No `any` allowed.
  2. Implement responsive design (Mobile-first).
  3. Keep components small, modular, and reusable.

# backend ภาพรวมโปรเจ็ค

    - เข้าไปที่ server folder และเรียนรู้
    - เขียนเชื่อม api เชื่อมกับ fronend page

## 📐 Core Architecture & File Structure

## 🛠️ Feature Requirements & Functions

### 1. Overall System Functions (ภาพรวมระบบ)

- **User Authentication**: Sign up, Login, Logout via Express Mongodb JWT token.
- **Exam List and **:
- **Product Management**: CRUD operations for inventory (Admin only).
- **Shopping Cart**: Add, remove, and update item quantities.
- **Order and History order**: watch all item and share state buy or cancel
- **Checkout System**: Integrate with Stripe API for payments.

---

## 🎨 Design System: Minimalist Mono (ขาว-ดำ-เทา)

- **Vibe:** Clean, premium, tech-forward, high-contrast, distraction-free.
- **Colors:**
  - Background: Pure White (`#FFFFFF`) or Deep Black (`#000000`) for Dark Mode.
  - Text: Pure Black (`#000000`) / Off-White (`#F5F5F5`).
  - Accents: Muted Grays (`#E5E5E5`, `#1A1A1A`) and sharp thin borders (`1px solid`).
- **Typography:** Sans-serif, bold headers, generous line-spacing, lots of negative space (Whitespace).

---

## 📐 Layout & Feature Sections (หน้าแรก)

### 1. Hero Section (ส่วนแรกสุด)

- **Headline:** สโลแกนสั้นๆ คมๆ (e.g., "Upgrade your grades. Distraction-free.")
- **Sub-headline:** "ชีทสรุปคุณภาพสูง และระบบจำลองข้อสอบอัจฉริยะ ขับเคลื่อนด้วย AI"
- **Call to Action (CTA):** ปุ่มกดคู่
  - [ปุ่มดำ ตัวหนังสือขาว] -> "เริ่มทำข้อสอบ"
  - [ปุ่มขาว ขอบดำ] -> "ดูชีทสรุปทั้งหมด"

### 2. Marketplace Section (โซนขายชีทสรุป)

- แสดงการ์ดสินค้าแบบ Grid (Minimal Grid Layout)
- **ข้อมูลบนการ์ด:** รูปปกชีท (โทนขาวดำ/มินิมอล), ชื่อวิชา, ราคา, ปุ่ม "เพิ่มลงตะกร้า"
- **Badge:** มีระบบฟิลเตอร์แท็ก เช่น `#คณิตศาสตร์`, `#ภาษาอังกฤษ`, `#ComputerScience`

### 3. Exam Testing Hub (โซนทำข้อสอบ)

- การ์ดแนะนำชุดข้อสอบเด่น (e.g., "Mock Exam: Computer 101")
- แสดงข้อมูล: จำนวนข้อ, เวลาที่ใช้ (เช่น `60 mins`), คะแนนเต็ม
- ปุ่ม "Start Exam" (เมื่อกดจะลิงก์ไปหน้าทำข้อสอบที่คุณทำไว้ก่อนหน้านี้)

---

### 🔐 1. Authentication Functions (ระบบสมาชิก)

_Implement these functions inside auth handler (e.g., `auth.js` or AuthContext)._

- **`registerUser(email, password, displayName)`**
  - **Logic:**
    - Validate that fields are not empty and password is at least 6 characters.
    - Check if the email already exists in the database.
    - If successful, create a new user record, automatically log them in, and redirect to the product page.
    - If failed, return a specific error message (e.g., "Email already in use").
- **`loginUser(email, password)`**
  - **Logic:**
    - Authenticate user credentials against the database.
    - If successful, store the user session/token (and save to `localStorage` or cookies if required) and update the `currentUser` state.
    - If failed, return "Invalid email or password".
- **`logoutUser()`**
  - **Logic:** Clear the user session, reset the `currentUser` state to `null`, and redirect to the login page.

---

### 📦 2. Product Listing Functions (ระบบแสดงสินค้า)

_Implement this logic in the product rendering component._

- **`renderProducts(products)`**
  - **UI & Logic Constraints:**
    - Loop through the products array and display them in a responsive grid layout.
    - Each product card must display: Image, Title, Price, and **Stock Status**.
    - **Stock Check:** Check the `product.stock` quantity.
      - If `stock > 0`: Show a green badge **"In Stock"** (มีสินค้า) and enable the "Add to Cart" button.
      - If `stock === 0`: Show a red badge **"Out of Stock"** (สินค้าหมด) and **DISABLE** the "Add to Cart" button (change button text to "Out of Stock").

---

### 🛒 3. Cart Management Functions (ระบบตะกร้าสินค้า)

_Implement these functions inside cart handler (e.g., `cart.js` or CartContext)._

- **`addToCart(product)`**
  - **Logic:**
    - First, check if `product.quantity === 0`. If so, abort immediately.
    - Check if this product already exists in the `cart` array.
    - If it **already exists**: Check if the current quantity in the cart is equal to the `product.quantity`. If it reached the stock limit, prevent adding more and alert the user. Otherwise, increase `quantity` by 1.
    - If it **does not exist**: Add the product to the array with an initial `quantity: 1`.
- **`getCartTotal()`**
  - **Logic:** Calculate and return the total price of all items currently in the cart (`price * quantity`).
- **`getCartCount()`**
  - **Logic:** Calculate and return the total number of items in the cart (sum of all quantities).

---

## Shopping Cart System

_Please implement the following functions for the Shopping Cart inside `app/Components/CartContext.js` and the UI component `app/components/CartModal.js`:_

1. **`addToCart(product, quantity)`**
   - Check if the item already exists in the cart.
   - If it exists, increase the quantity.
   - If not, append the new product with `quantity: 1`.
   - Max quantity per item is limited to 10.

2. **`removeFromCart(productId)`**
   - Completely remove the specific item from the cart array based on ID.

3. **`updateQuantity(productId, newQuantity)`**
   - Update the quantity directly from an input field.
   - If `newQuantity` is less than 1, automatically trigger `removeFromCart`.

4. **`clearCart()`**
   - Reset the cart state back to an empty array `[]`.

5. **`calculateTotals()`**
   - A derived state function to return:
     - `totalItems`: Total number of individual items.
     - `subtotal`: Price before tax.
     - `tax`: 7% of subtotal.
     - `grandTotal`: subtotal + tax.

## 🎯 CURRENT FOCUS: QR Code Payment System (Frontend & Backend MVC)

Please implement an automated QR Code Payment feature. The frontend will fetch a Dynamic QR Code, and the backend (Node.js/Express MVC) will handle the processing, MongoDB schema relations, and automatic payment status updates via Webhook/Polling.

---

### 💾 1. MongoDB Database Schema & Relationships

_Create a `Payment` model and establish relationships with `User` and `Order` models in `vibe-code-my-ecommerce/server/models/Payment.js`._

- **`PaymentSchema` Requirements:**
  - `userId`: `ObjectId`, ref: `'User'` (Required) - The user who made the payment.
  - `orderId`: `ObjectId`, ref: `'Order'` (Required) - The associated order being paid.
  - `amount`: `Number` (Required) - Total amount paid.
  - `currency`: `String` (Default: `'THB'`).
  - `paymentMethod`: `String` (e.g., `'qr_code'`, `'promptpay'`).
  - `transactionId`: `String` (Unique) - The ID returned from the Payment Gateway.
  - `status`: `String`, enum: `['pending', 'successful', 'failed']` (Default: `'pending'`).
  - `createdAt`: `Date` (Default: `Date.now`).

---

### 🗂️ 2. Backend MVC Architecture (Payment Module)

_Implement the controller and routing for handling payments._

- **Controller (`vibe-code-my-ecommerce/server/controllers/paymentController.js`):**
  - **`createQrPayment(req, res)`**:
    1. Receive `orderId` and `userId` from the request.
    2. Fetch order details from the `Order` model to get the final price.
    3. Call the Payment Gateway API (e.g., Stripe/Omise/GBPrime) to generate a dynamic QR Code.
    4. Save a new `Payment` document in MongoDB with status `'pending'`.
    5. Return the QR Code URL/Image string and `paymentId` to the frontend.
  - **`handlePaymentWebhook(req, res)`**:
    1. Receive the automated payment confirmation from the Gateway (Webhook endpoint).
    2. Verify the webhook signature for security.
    3. If payment is successful, find the `Payment` document by `transactionId` and update status to `'successful'`.
    4. Find the corresponding `Order` document and update status to `'paid'`.
- **Routes (`vibe-code-my-ecommerce/server/routes/paymentRoutes.js`):**
  - `POST /api/payment/charge` -> triggers `createQrPayment` (Protected route)
  - `POST /api/payment/webhook` -> triggers `handlePaymentWebhook` (Public route for Gateway)
- **Use Route (`vibe-code-my-ecommerce/server/src/index.mjs`):**

---

### 💻 3. Frontend QR Code Payment & Automated Detection

_Implement this logic in your Frontend Payment View using HTML, Bootstrap, and JavaScript._

- **`initiatePayment(orderId)`**
  - Send a request to Backend `POST /api/payment/charge`.
  - Display a loading spinner while waiting.
  - Once the response is received, render the QR Code image inside a Bootstrap Modal or dedicated area.
- **`startPaymentStatusCheck(paymentId)`**
  - **Automated Verification Logic:** Since the backend handles the webhook, the frontend must listen for the update. Implement a **Polling system** (using `setInterval` every 3 seconds) or **WebSocket listener** to check `GET /api/payment/status/:id`.
  - **If status becomes `'successful'`:**
    - Immediately stop the interval.
    - Show a beautiful Bootstrap alert or sweetalert success animation ("Payment Received!").
    - Automatically redirect the user to the "Order Success" or Receipt page within 2 seconds.
  - **If status becomes `'failed'`:** Stop interval and show an error message.

---

1. Overview
   พัฒนาฟีเจอร์ระบบเลือกทำข้อสอบ พร้อมระบบจับเวลา ตรวจคำตอบ (เฉลย) และเก็บสถิติประวัติการทำข้อสอบของผู้ใช้งาน (Exam History & Statistics)

---

## 2. Core Functional Requirements

### 2.1 Exam Selection Page (หน้าเลือกข้อสอบ)

- **Category Separation:** จัดกลุ่มข้อสอบแยกตามหมวดหมู่ (Category) อย่างชัดเจน
- **Exam Card/Item:** ในแต่ละชุดข้อสอบ ให้แสดงข้อมูลเบื้องต้น (ชื่อชุดข้อสอบ, จำนวนข้อ, เวลาที่ใช้)
- **History Preview:** เมื่อคลิกเข้าไปในข้อสอบชุดนั้นๆ (หรือก่อนเริ่มทำ) ให้แสดง **History** ว่าผู้ใช้เคยทำข้อสอบชุดนี้ไปแล้วหรือยัง
  - ถ้าเคยทำแล้ว ให้แสดง: วันที่ทำล่าสุด, คะแนนที่ได้, และเวลาที่ใช้ไป

### 2.2 Examination & Timer Page (หน้าทำข้อสอบและระบบจับเวลา)

- **Quiz Interface:** แสดงโจทย์และตัวเลือกคำตอบทีละข้อ หรือจัดวางในรูปแบบที่ใช้งานง่าย
- **Countdown Timer:** มีระบบจับเวลาถอยหลัง หากหมดเวลาจะทำการส่งคำตอบอัตโนมัติ (Auto-submit)
- **Navigation Panel (แถบสถานะด้านขวา):**
  - แสดงรายการหมายเลขข้อสอบทั้งหมด (เช่น ข้อ 1, 2, 3, ...) ไว้ที่ **ฝั่งขวาของหน้าจอ**
  - **ข้อที่ทำแล้ว:** แสดงสถานะเป็น **สีเทา (Grayed out)** เพื่อให้รู้ว่าตอบแล้ว
  - **ข้อที่ยังไม่ได้ทำ:** แสดงสถานะเป็น **สีขาว (White/Default)**
  - **Interactive Link:** ผู้ใช้สามารถคลิกที่ตัวเลขข้อสอบฝั่งขวาเพื่อ Jump (วาร์ป) ไปยังข้อนั้นๆ เพื่อเลือกคำตอบหรือเปลี่ยนคำตอบได้ตลอดเวลาตราบใดที่ยังไม่กดส่งข้อสอบ

### 2.3 Grading & Answer Key (ระบบตรวจทานและเฉลย)

- **Submission:** มีปุ่ม "ส่งข้อสอบ" (Submit) โดยจะมีการแจ้งเตือน (Confirmation Dialog) หากยังมีข้อที่ยังไม่ได้ทำ
- **Instant Evaluation:** หลังจากส่งคำตอบทั้งหมด ระบบจะทำการตรวจคะแนนทันที
- **Answer Key (เฉลย):** แสดงเฉลยรายละเอียดหลังส่งคำตอบ โดยระบุชัดเจนว่าข้อไหนตอบถูก ข้อไหนตอบผิด พร้อมแสดงคำอธิบาย (ถ้ามี)

### 2.4 Statistics & Progress Tracking (ระบบเก็บสถิติ)

- บันทึกผลคะแนนลงในระบบหลังจากทำข้อสอบเสร็จทุกครั้ง
- เก็บข้อมูลประวัติ: `Exam ID`, `User ID`, `Score`, `Time Spent`, `Date Completed`

---

## 3. Technical & UI Specifications

### 3.1 Component Structure (Suggested)

- `ExamCategoryList`: Component สำหรับหน้าแยกหมวดหมู่
- `ExamDetailWithHistory`: Component แสดงรายละเอียดข้อสอบและประวัติการทำ
- `QuizContainer`: Component หลักสำหรับหน้าทำข้อสอบ
- `SidebarNavigation`: Component แถบตัวเลขฝั่งขวา (Manage Active/Inactive states)
- `Timer`: Component จัดการเวลาและการ Auto-submit
- `QuizResult`: Component แสดงคะแนนและเฉลยหลังทำเสร็จ

### 3.2 State Management Rules

- `answers`: เก็บ State คำตอบของ User (เช่น `{ [questionId]: selectedOptionId }`)
- `currentQuestionIndex`: เก็บตำแหน่งข้อที่กำลังทำอยู่
- `isSubmitted`: Boolean เช็คสถานะการส่งเพื่อเปลี่ยนโหมดหน้าจอเป็น "เฉลย"

---

## 4. Definition of Done (DoD)

1. User สามารถเลือกข้อสอบตามหมวดหมู่ และดูประวัติการทำข้อสอบชุดนั้นได้
2. แถบตัวเลขด้านขวาแสดงสีเทา (ทำแล้ว) และสีขาว (ยังไม่ทำ) ถูกต้องตามการเลือกของ User และสามารถกดเปลี่ยนข้อได้
3. ระบบจับเวลาทำงานถูกต้อง และ Auto-submit เมื่อหมดเวลา
4. แสดงหน้าเฉลยและคะแนนอย่างถูกต้องหลังกดส่งข้อสอบ

⚠️ **Coding Guidelines for AI:**

1. Secure the backend routes using JWT Authentication middleware to protect `req.user`.
2. Do not hardcode API Keys or Gateway credentials; use `process.env`.
3. Ensure the Frontend UI disables the checkout button once clicked to prevent double-charging.

⚠️ **Coding Guidelines for AI:**

1. Handle loading states (`isLoading`) during login/register API calls.
2. Ensure that adding an item to the cart does NOT exceed the available database stock.
3. Keep the UI clean, modern, and aligned with Bootstrap classes.

⚠️ **Important Note for AI:**
Every time the cart state changes, you must sync the current state to `localStorage` so the user doesn't lose their items on page refresh.

# สร้างไฟล์และ feture ต่าง ๆโดยแยกเป็นส่วน ๆ ตามโครงสร้าง folder นี้

- โดยทำให้โค๊ต clean และแนบ comment เป็นภาษาไทยเพื่อให้ผู้พัฒนาสามารถเข้าใจโค๊ตได้ง่าย เหมาะต่อการแก้ไขและพัฒนาต่อ
  Follow this folder structure strictly when creating new files:

```text
vibe-code-my-ecommerce/
├── app/
    ├──css # แยกสไตล์ตามฟีเจอร์หลัก (ไม่รวมในไฟล์เดียว)
        ├──exam.css # หน้าทำข้อสอบ (จัดการ Layout แถบขวาที่เป็นสีเทา/ขาว)
        ├──global.css # สไตล์ส่วนกลาง เช่น Navbar, Reset CSS
        ├──products.css # หน้าสินค้าและตะกร้า

    ├──javascript  # แยก Logic (JavaScript) ตามฟีเจอร์เด็ดขาด
        ├──auth.js # จัดการฟอร์ม Login/Register + เก็บ Token
        ├──cart.js # จัดการ Add to Cart + คำนวณราคา (Vat/GP ถ้ามี)
        ├──exam.js # จัดการระบบสอบ จับเวลา และ Sidebar ตัวเลขด้านขวา
        ├──product.js # จัดการระบบสินค้า brown สินค้า sort price product pagination
        ├──order.js # จัดการ order ระบบสินค้า หลังจาก สั่งซื้อสินค้าแสดงสถานะสินค้า
    ├──web
        ├──index.html # หน้าแรก / หน้าแสดงสินค้า (Browse Product)
        ├──auth.html # หน้า Login / Register
        ├──product.html # หน้า product ทั้งหมด
        ├──cart.html # หน้าตะกร้าสินค้า
        ├──exam-list.html # หน้าเลือกข้อสอบตามหมวดหมู่ (Category) และดู History
        ├──exam-room.html # หน้าทำข้อสอบที่มีการจับเวลาและแถบสีเทาด้านขวา
├── server/
├── AGENTS.md
├── .gitignore
└── README.md
```
