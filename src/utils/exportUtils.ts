import * as XLSX from 'xlsx';
import { Exam, LessonPlan, SlideDeck, StudentGrade, Classroom } from '../types';

export const exportUtils = {
  // Export Gradebook to real XLSX
  exportGradebookToExcel(grades: StudentGrade[], classroom?: Classroom, schoolYear: string = '2026-2027') {
    const data = grades.map((g, index) => ({
      'STT': index + 1,
      'Mã học sinh': g.studentCode,
      'Họ và tên': g.studentName,
      'Khối': g.grade,
      'Học kỳ': g.semester,
      'TX 1': g.scores.tx1 ?? '',
      'TX 2': g.scores.tx2 ?? '',
      'TX 3': g.scores.tx3 ?? '',
      'Bài tập': g.scores.bt ?? '',
      'Giữa kỳ (GK)': g.scores.gk ?? '',
      'Cuối kỳ (CK)': g.scores.ck ?? '',
      'Điểm TB': g.averageScore ?? '',
      'Xếp loại': g.academicRating ?? '',
      'Ghi chú': g.notes ?? ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Diem_Vat_Ly');

    const fileName = classroom
      ? `Bang_Diem_VatLy_${classroom.code}_${schoolYear}.xlsx`
      : `Bang_Diem_VatLy_${schoolYear}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  },

  // Export Exam to formatted Word DOCX (as HTML-based DOCX compatible with Microsoft Word)
  exportExamToDoc(exam: Exam, includeSolutions: boolean = false) {
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${exam.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 2px; text-transform: uppercase; font-size: 14pt; }
          .header p { margin: 2px; font-style: italic; }
          .q-title { font-weight: bold; margin-top: 15px; }
          .options { margin-left: 20px; }
          .solution { background: #f1f5f9; padding: 8px; border-left: 3px solid #2563eb; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p>SỞ GIÁO DỤC VÀ ĐÀO TẠO • TRƯỜNG THPT CHUYÊN</p>
          <h2>${exam.title}</h2>
          <p>Môn: VẬT LÝ - KHỐI ${exam.grade} | Học kỳ: ${exam.semester} | Mã đề: ${exam.code}</p>
          <p>Thời gian làm bài: ${exam.durationMinutes} phút (Không kể thời gian phát đề)</p>
          <hr />
        </div>
    `;

    exam.questions.forEach((q, idx) => {
      content += `
        <div class="question-block">
          <p class="q-title">Câu ${idx + 1} (${q.points} điểm) [${q.level}]: ${q.content}</p>
      `;

      if (q.options && q.options.length > 0) {
        content += `<div class="options">`;
        q.options.forEach(opt => {
          content += `<p style="margin: 4px 0;">${opt}</p>`;
        });
        content += `</div>`;
      }

      if (includeSolutions) {
        content += `
          <div class="solution">
            <p><strong>Đáp án đúng:</strong> ${q.correctAnswer}</p>
            <p><strong>Lời giải chi tiết:</strong> ${q.explanation}</p>
          </div>
        `;
      }

      content += `</div>`;
    });

    content += `
        <br/><hr/>
        <p style="text-align: center; font-style: italic;">--- HẾT ---</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.code}_${includeSolutions ? 'KemDapAn' : 'DeThi'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Export Answer Key & Solutions Document separately
  exportAnswerKeyDoc(exam: Exam) {
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Đáp án và Lời giải chi tiết - ${exam.code}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 2px; text-transform: uppercase; font-size: 14pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th, td { border: 1px solid #333; padding: 6px; text-align: center; }
          .sol-box { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT</h2>
          <p>${exam.title} - Mã đề: ${exam.code}</p>
          <hr />
        </div>

        <h3>I. BẢNG ĐÁP ÁN NHANH</h3>
        <table>
          <thead>
            <tr><th>Câu</th><th>Đáp án</th><th>Mức độ</th><th>Điểm</th></tr>
          </thead>
          <tbody>
    `;

    exam.questions.forEach((q, idx) => {
      content += `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-weight: bold; color: #1e3a8a;">${q.correctAnswer}</td>
          <td>${q.level}</td>
          <td>${q.points}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>

        <h3>II. LỜI GIẢI CHI TIẾT & BIỂU ĐIỂM TỪNG CÂU</h3>
    `;

    exam.questions.forEach((q, idx) => {
      content += `
        <div class="sol-box">
          <p><strong>Câu ${idx + 1}:</strong> ${q.content}</p>
          <p style="color: #047857; font-weight: bold;">Đáp án: ${q.correctAnswer}</p>
          <p><strong>Hướng dẫn giải:</strong> ${q.explanation}</p>
        </div>
      `;
    });

    content += `</body></html>`;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.code}_DAP_AN_CHI_TIET.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Export Lesson Plan to Word Doc
  exportLessonPlanToDoc(lp: LessonPlan) {
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${lp.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; margin: 30px; }
          h2, h3, h4 { color: #0f172a; margin-top: 15px; }
          .act-box { border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <p>KẾ HOẠCH BÀI DẠY THEO CÔNG VĂN 5512/BGD-ĐT</p>
          <h2 style="text-transform: uppercase;">${lp.title}</h2>
          <p>Môn: Vật lý - Lớp ${lp.grade} | Bộ sách: ${lp.textbook} | Thời lượng: ${lp.durationPeriods} tiết</p>
          <hr />
        </div>

        <h3>I. MỤC TIÊU BÀI HỌC</h3>
        <p><strong>1. Kiến thức:</strong></p>
        <ul>${lp.objectives.knowledge.map(k => `<li>${k}</li>`).join('')}</ul>
        <p><strong>2. Năng lực:</strong></p>
        <ul>${lp.objectives.competencies.map(c => `<li>${c}</li>`).join('')}</ul>
        <p><strong>3. Phẩm chất:</strong></p>
        <ul>${lp.objectives.qualities.map(q => `<li>${q}</li>`).join('')}</ul>

        <h3>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h3>
        <ul>${lp.teachingTools.map(t => `<li>${t}</li>`).join('')}</ul>

        <h3>III. TIẾN TRÌNH DẠY HỌC</h3>
    `;

    lp.activities.forEach((act) => {
      content += `
        <div class="act-box">
          <h4>${act.name} (${act.durationMinutes} phút)</h4>
          <p><strong>a. Mục tiêu:</strong> ${act.goal}</p>
          <p><strong>b. Nội dung:</strong> ${act.content}</p>
          <p><strong>c. Tổ chức thực hiện:</strong></p>
          <p>- <em>Hoạt động của giáo viên:</em> ${act.teacherAction}</p>
          <p>- <em>Hoạt động của học sinh:</em> ${act.studentAction}</p>
          <p><strong>d. Sản phẩm dự kiến:</strong> ${act.output}</p>
        </div>
      `;
    });

    content += `
        <h3>IV. PHƯƠNG PHÁP VÀ HÌNH THỨC ĐÁNH GIÁ</h3>
        <p>${lp.assessmentMethod}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lp.code}_GiaoAn_5512.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Export Slide Deck Presentation Outline
  exportSlideOutline(deck: SlideDeck) {
    let content = `DÀN Ý BÀI GIẢNG ĐIỆN TỬ POWERPOINT
========================================
Tên bài giảng: ${deck.title}
Khối: Lớp ${deck.grade} | Chương: ${deck.chapter}
Chủ đề: ${deck.topic}
Số lượng slide: ${deck.slideCount} slide
Mô tả: ${deck.description}
========================================\n\n`;

    deck.slides.forEach(s => {
      content += `----------------------------------------\n`;
      content += `SLIDE ${s.slideNumber}: ${s.title.toUpperCase()}\n`;
      content += `----------------------------------------\n`;
      content += `Nội dung hiển thị trên màn hình:\n`;
      s.bullets.forEach((b, idx) => {
        content += `  • ${b}\n`;
      });
      if (s.diagramIdea) {
        content += `\n[Gợi ý hình ảnh/sơ đồ 3D]: ${s.diagramIdea}\n`;
      }
      if (s.interactiveQuestion) {
        content += `\n[Câu hỏi tương tác ngắn]: ${s.interactiveQuestion}\n`;
      }
      content += `\n[Ghi chú thuyết trình của giáo viên]:\n${s.teacherNotes}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deck.code}_DanY_Slide_BaiGiang.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
