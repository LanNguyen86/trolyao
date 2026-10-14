# Physics Teacher Assistant – Trợ lý Giảng viên Vật lý THPT

Nền tảng quản lý giảng dạy Vật lý THPT (lớp 10, 11, 12 theo chương trình GDPT 2018), tích hợp kho giáo án (chuẩn Công văn 5512/BGD-ĐT), ngân hàng đề thi phân hóa, slide bài giảng PowerPoint, bài tập về nhà, sổ điểm điện tử (chuẩn Thông tư 22) và Trợ lý AI Vật lý thông minh sử dụng Gemini 3.8 Flash.

---

## 1. Cấu trúc Dự án (Architecture)

Dự án được thiết kế theo kiến trúc Full-stack hiện đại, hỗ trợ chạy song song 2 cơ chế:
- **Chạy cục bộ / Standalone / AI Studio:** Chạy máy chủ Express (`server.ts`) qua lệnh `npm run dev` trên cổng 3000 kết hợp Vite middleware.
- **Triển khai Serverless trên Vercel:** Tự động chia tách:
  - Frontend SPA tĩnh được build vào thư mục `dist/` và phân phối qua Edge CDN toàn cầu của Vercel.
  - Backend API được xử lý qua **Vercel Serverless Function** tại entry point `api/index.ts` kết hợp điều hướng trong `vercel.json`.

```
├── api/
│   └── index.ts               # Entry point Serverless Function cho Vercel
├── src/                       # Mã nguồn Frontend React 19 + TypeScript
│   ├── components/            # Header, Sidebar, QuickActionModal...
│   ├── data/                  # Dữ liệu mẫu THPT (lớp, đề thi, giáo án, điểm...)
│   ├── services/              # storage.ts (LocalStorage), geminiService.ts (API client)
│   ├── types/                 # Định nghĩa kiểu dữ liệu TypeScript
│   ├── utils/                 # exportUtils.ts (Xuất/Nhập Excel, Word DOCX)
│   ├── views/                 # 11 phân hệ chức năng sư phạm
│   ├── App.tsx                # Ứng dụng React chính
│   ├── index.css              # Tailwind CSS v4 styling
│   └── main.tsx               # Entry point React DOM
├── server.ts                  # Backend Express Server & Gemini AI integration
├── vercel.json                # Cấu hình rewrite & routing cho Vercel
├── package.json               # Dependencies & build scripts
├── vite.config.ts             # Cấu hình Vite bundler
├── tsconfig.json              # Cấu hình TypeScript
└── .env.example               # Mẫu danh sách biến môi trường
```

---

## 2. Danh sách Biến Môi trường (Environment Variables)

Khi triển khai lên Vercel hoặc chạy cục bộ, cấu hình các biến sau:

| Tên biến | Bắt buộc | Mục đích / Mô tả |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Có** | API Key từ Google AI Studio để kích hoạt Trợ lý AI (soạn đề, soạn giáo án, làm dàn ý slide, phân tích dữ liệu lớp học). |
| `NODE_ENV` | Không | Môi trường (`production` hoặc `development`). Vercel tự động đặt là `production`. |
| `PORT` | Không | Cổng chạy máy chủ cục bộ (mặc định: `3000`). Không cần thiết lập trên Vercel. |

> **Lưu ý bảo mật:** Toàn bộ API Key chỉ được lưu trữ và truy cập ở tầng server (backend). Frontend tuyệt đối không lưu API Key, mọi yêu cầu từ giao diện đều gọi qua API nội bộ `/api/ai/*`.

---

## 3. Hướng dẫn Chạy thử Cục bộ (Local Development)

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Thiết lập biến môi trường
Tạo file `.env` ở thư mục gốc dựa trên mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và điền `GEMINI_API_KEY` của bạn (lấy tại [Google AI Studio](https://aistudio.google.com/app/apikey)).

### Bước 3: Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### Bước 4: Kiểm tra kiểm thử và build production
```bash
# Kiểm tra TypeScript
npm run lint

# Build production tĩnh
npm run build
```

---

## 4. Hướng dẫn Triển khai lên Vercel từ GitHub

### Bước 1: Đưa mã nguồn lên GitHub
1. Khởi tạo Git repository (nếu chưa có):
   ```bash
   git init
   git add .
   git commit -m "feat: Prepare Physics Teacher Assistant for Vercel deployment"
   ```
2. Tạo một repository mới trên tài khoản GitHub của bạn (ví dụ `physics-teacher-assistant`).
3. Đẩy code lên GitHub:
   ```bash
   git remote add origin https://github.com/<tai-khoan-cua-ban>/physics-teacher-assistant.git
   git branch -M main
   git push -u origin main
   ```

### Bước 2: Nhập dự án vào Vercel
1. Đăng nhập vào [Vercel](https://vercel.com) bằng tài khoản GitHub.
2. Nhấn nút **"Add New..."** -> Chọn **"Project"**.
3. Tìm và chọn repository `physics-teacher-assistant` vừa đẩy lên -> Nhấn **"Import"**.

### Bước 3: Cấu hình Vercel Project
- **Framework Preset:** Vercel sẽ tự động nhận diện là `Vite`.
- **Root Directory:** Để trống `./` (mặc định).
- **Build Command:** `npm run build` (hoặc `vite build`).
- **Output Directory:** `dist`.
- **Environment Variables:**
  - Nhấp vào mục **Environment Variables**.
  - Thêm khóa: `GEMINI_API_KEY`
  - Giá trị: Nhập API key Google Gemini của bạn.

### Bước 4: Nhấn "Deploy"
Vercel sẽ tự động:
1. Cài đặt các gói thư viện (`npm install`).
2. Build frontend thành các tệp tối ưu trong thư mục `dist/`.
3. Nhận diện `api/index.ts` và triển khai Express API thành Vercel Serverless Function.
4. Cung cấp một đường link truy cập công khai dạng `https://physics-teacher-assistant.vercel.app`.

---

## 5. Danh sách API Endpoints Backend

Tất cả các route dưới đây hoạt động đồng thời trên cả môi trường Dev cục bộ và Vercel:

- `GET /api/health` – Kiểm tra trạng thái máy chủ và kết nối Gemini API.
- `POST /api/ai/chat` – Hỏi đáp kiến thức Vật lý, giải bài tập mẫu và kiểm tra đơn vị SI.
- `POST /api/ai/generate-exam` – Soạn đề thi phân hóa 4 mức độ nhận thức kèm lời giải.
- `POST /api/ai/generate-lesson-plan` – Soạn Kế hoạch bài dạy chuẩn Công văn 5512/BGD-ĐT.
- `POST /api/ai/generate-slides` – Lên dàn ý trình chiếu PowerPoint kèm ghi chú thuyết trình.
- `POST /api/ai/generate-assignment` – Sinh bài tập phân hóa theo trình độ học sinh.
- `POST /api/ai/analyze-student-performance` – Phân tích dữ liệu kết quả học tập và khuyến nghị sư phạm.

---

## 6. Tính năng Dữ liệu & Khôi phục

- Ứng dụng đã được nạp sẵn dữ liệu mẫu thực tế của 3 khối lớp (10A1, 11B2, 12A3), 24 học sinh, 10+ đề thi, 10+ giáo án, 10+ slide và 15+ bài tập.
- Toàn bộ dữ liệu được lưu trữ tự động trong `LocalStorage` của trình duyệt.
- Hỗ trợ tính năng **Xuất sao lưu JSON**, **Khôi phục tệp JSON**, và **Đặt lại dữ liệu mẫu ban đầu** tại mục **Cài đặt hệ thống**.
- Khi cấu hình thêm Firebase Firestore, ứng dụng sẵn sàng kết nối đồng bộ đám mây mà không cần thay đổi giao diện.
