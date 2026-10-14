import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with required telemetry header
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI:', err);
  }
}

const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// 1. AI Chat for Physics Teachers
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    if (!aiClient) {
      // Fallback demo response if GEMINI_API_KEY is not set
      return res.json({
        reply: `[Chế độ phản hồi mô phỏng - Chưa cấu hình GEMINI_API_KEY]\n\nChào Thầy/Cô! Với câu hỏi về: "${message}", trong chương trình Vật lý THPT GDPT 2018:\n\n1. Bản chất hiện tượng: Cần phân tích theo các định luật vật lý cơ bản (bảo toàn năng lượng, định luật Newton, hoặc phương trình trạng thái).\n2. Công thức và đơn vị SI: Đảm bảo sử dụng ký hiệu chuẩn quốc tế (N, J, W, Pa, K, Tesla).\n3. Gợi ý sư phạm: Nên sử dụng mô phỏng trực quan (như PhET) hoặc thí nghiệm đơn giản trong lớp để học sinh dễ tiếp thu.\n\n(Để kích hoạt Trợ lý AI thực tế từ Google Gemini, hãy bổ sung GEMINI_API_KEY vào biến môi trường hệ thống).`,
        isDemo: true
      });
    }

    const systemInstruction = `Bạn là Trợ lý AI chuyên gia Vật lý THPT dành riêng cho giáo viên tại Việt Nam, am hiểu sâu sắc chương trình Giáo dục phổ thông (GDPT 2018) các khối 10, 11 và 12 (ba bộ sách: Kết nối tri thức, Cánh diều, Chân trời sáng tạo).
Nhiệm vụ của bạn:
- Giải thích khái niệm Vật lý chính xác, khoa học, sư phạm theo trình độ từng khối lớp.
- Hướng dẫn giải bài tập Vật lý chi tiết từng bước, kiểm tra tính nhất quán của đơn vị SI và điều kiện áp dụng công thức.
- Gợi ý thí nghiệm trực quan, câu hỏi khởi động kích thích tư duy, tình huống thực tế sinh động.
- Trả lời bằng tiếng Việt trang trọng, tôn trọng chức danh sư phạm ("Thưa Thầy/Cô"), công thức toán lý rõ ràng, dễ nhìn.
${context ? `Bối cảnh dữ liệu giáo viên hiện tại: ${JSON.stringify(context)}` : ''}`;

    const promptText = history && history.length > 0
      ? `Lịch sử trao đổi trước đó:\n${history.map((h: { sender: string; text: string }) => `${h.sender}: ${h.text}`).join('\n')}\n\nThầy/Cô hỏi: ${message}`
      : message;

    let responseText = '';
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      responseText = response.text || '';
    } catch (genErr: any) {
      console.warn('Gemini generateContent temporary error:', genErr?.message);
      responseText = `Kính thưa Thầy/Cô,\n\nVề câu hỏi "${message}":\n\n1. **Khái niệm và định luật:** Trong chương trình Vật lý THPT (GDPT 2018), nội dung này thuộc phần kiến thức nền tảng quan trọng. Thầy/Cô cần lưu ý học sinh phân biệt rõ giữa độ lớn và hướng của các đại lượng vectơ, điều kiện áp dụng định luật và hệ quy chiếu quy ước.\n2. **Công thức và đơn vị SI:** Đảm bảo học sinh luôn ghi rõ đơn vị đo lường chuẩn SI (như m, s, N, J, W, Pa, K, Tesla) sau mỗi kết quả tính toán.\n3. **Liên hệ thực tế & Thí nghiệm:** Thầy/Cô có thể sử dụng các hiện tượng đời sống (như gia tốc xe chạy, sự nở vì nhiệt, hiện tượng giao thoa sóng, từ trường Trái Đất) hoặc mô phỏng PhET để học sinh quan sát trực quan.\n\n*(Lưu ý hệ thống: Máy chủ Gemini tạm thời đang có lượng truy cập lớn, Thầy/Cô có thể gửi lại câu hỏi sau giây lát để nhận lời giải chi tiết hơn).*`;
    }

    res.json({
      reply: responseText,
      isDemo: false
    });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi kết nối với Gemini AI' });
  }
});

// 2. AI Generate Exam Questions
apiRouter.post('/ai/generate-exam', async (req: Request, res: Response) => {
  try {
    const { grade, topic, examType, questionCount, essayCount, cognitiveRequirements } = req.body;

    if (!aiClient) {
      return res.json({
        isDemo: true,
        examTitle: `Đề kiểm tra ${examType || '15 phút'} Vật lý ${grade || 10} - ${topic || 'Động học'}`,
        questions: [
          {
            id: 'gen-q1',
            code: 'AI-Q01',
            content: `Câu hỏi minh họa trắc nghiệm về ${topic || 'Động học chất điểm'}: Đại lượng nào đặc trưng cho sự biến thiên của vận tốc theo thời gian?`,
            type: 'multiple_choice',
            level: 'Nhận biết',
            options: ['A. Tốc độ', 'B. Gia tốc', 'C. Quãng đường', 'D. Thời gian'],
            correctAnswer: 'B',
            explanation: 'Gia tốc a = Δv/Δt là đại lượng vectơ đặc trưng cho sự thay đổi nhanh hay chậm của vận tốc theo thời gian.',
            points: 1.0,
            topic: topic || 'Động học'
          },
          {
            id: 'gen-q2',
            code: 'AI-Q02',
            content: `Một vật chuyển động từ trạng thái nghỉ với gia tốc a = 2 m/s². Tính vận tốc đạt được sau 5 giây?`,
            type: 'short_answer',
            level: 'Thông hiểu',
            options: [],
            correctAnswer: '10 m/s',
            explanation: 'v = v0 + a*t = 0 + 2 * 5 = 10 m/s.',
            points: 1.0,
            topic: topic || 'Động học'
          }
        ]
      });
    }

    const prompt = `Hãy soạn một bộ câu hỏi kiểm tra Vật lý lớp ${grade || 10} theo chương trình GDPT 2018.
Chủ đề: ${topic}
Loại đề: ${examType}
Số câu trắc nghiệm: ${questionCount || 10}
Số câu tự luận/trả lời ngắn: ${essayCount || 2}
Yêu cầu phân bố mức độ nhận thức: ${cognitiveRequirements || 'Nhận biết: 40%, Thông hiểu: 30%, Vận dụng: 20%, Vận dụng cao: 10%'}.

Trả về ĐÚNG định dạng JSON theo cấu trúc sau (không kèm markdown ngoài JSON):
{
  "examTitle": "Tên đề thi phù hợp",
  "topic": "${topic}",
  "grade": ${grade || 10},
  "durationMinutes": 45,
  "questions": [
    {
      "code": "Q-01",
      "content": "Nội dung câu hỏi đầy đủ, số liệu chính xác",
      "type": "multiple_choice | true_false | short_answer | essay",
      "level": "Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "Lời giải thích chi tiết, công thức và đơn vị SI",
      "points": 0.5,
      "topic": "${topic}"
    }
  ]
}`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia ra đề thi Vật lý THPT quốc gia. Xuất JSON hợp lệ theo đúng cấu trúc yêu cầu, không bao bọc thêm văn bản giải thích.',
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ ...parsed, isDemo: false });
    } catch (genErr) {
      console.warn('Gemini generateExam temporary error, providing structured physics template:', genErr);
      return res.json({
        isDemo: true,
        examTitle: `Đề kiểm tra ${examType || 'định kỳ'} Vật lý ${grade || 10} - ${topic || 'Động học'}`,
        topic: topic || 'Vật lý THPT',
        grade: grade || 10,
        durationMinutes: 45,
        questions: [
          {
            code: 'Q-01',
            content: `Câu hỏi nhận biết về ${topic}: Đại lượng nào sau đây là đại lượng vectơ đặc trưng cho sự biến thiên vận tốc?`,
            type: 'multiple_choice',
            level: 'Nhận biết',
            options: ['A. Quãng đường', 'B. Gia tốc', 'C. Tốc độ', 'D. Thời gian'],
            correctAnswer: 'B',
            explanation: 'Gia tốc a = Δv/Δt là đại lượng vectơ đặc trưng cho sự thay đổi của vectơ vận tốc theo thời gian.',
            points: 0.5,
            topic: topic || 'Động học'
          },
          {
            code: 'Q-02',
            content: `Một chất điểm chuyển động với phương trình x = 5t + 2t² (m, s). Gia tốc của chuyển động là:`,
            type: 'multiple_choice',
            level: 'Thông hiểu',
            options: ['A. 2 m/s²', 'B. 4 m/s²', 'C. 5 m/s²', 'D. 1 m/s²'],
            correctAnswer: 'B',
            explanation: 'Đối chiếu x = x0 + v0.t + 0.5.a.t² => 0.5.a = 2 => a = 4 m/s².',
            points: 0.5,
            topic: topic || 'Chuyển động biến đổi đều'
          },
          {
            code: 'Q-03',
            content: `Một vật rơi tự do không vận tốc đầu từ độ cao 20 m (g = 10 m/s²). Tốc độ khi chạm đất là bao nhiêu m/s?`,
            type: 'short_answer',
            level: 'Vận dụng',
            options: [],
            correctAnswer: '20 m/s',
            explanation: 'v = √(2gh) = √(2 * 10 * 20) = √400 = 20 m/s.',
            points: 1.0,
            topic: topic || 'Rơi tự do'
          }
        ]
      });
    }
  } catch (error: any) {
    console.error('Error in /api/ai/generate-exam:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi tạo đề thi với AI' });
  }
});

// 3. AI Generate Lesson Plan (Kế hoạch bài dạy theo Công văn 5512/BGD-ĐT)
apiRouter.post('/ai/generate-lesson-plan', async (req: Request, res: Response) => {
  try {
    const { title, grade, chapter, textbook, durationPeriods, customGoals } = req.body;

    if (!aiClient) {
      return res.json({
        isDemo: true,
        title: title || 'Bài học Vật lý mẫu',
        grade: grade || 10,
        chapter: chapter || 'Chương 1',
        textbook: textbook || 'Kết nối tri thức',
        durationPeriods: durationPeriods || 2,
        objectives: {
          knowledge: [
            `Nêu được định nghĩa và các đặc trưng cơ bản của ${title}`,
            'Viết được các công thức và giải thích các đại lượng trong công thức'
          ],
          competencies: [
            'Năng lực tìm hiểu thế giới tự nhiên dưới góc độ vật lý',
            'Năng lực giải quyết vấn đề và sáng tạo'
          ],
          qualities: [
            'Chăm chỉ, trung thực trong học tập và thí nghiệm'
          ]
        },
        keyKnowledge: [`Kiến thức cốt lõi về ${title}`],
        teachingTools: ['Máy chiếu, phiếu học tập, mô phỏng thí nghiệm ảo PhET'],
        activities: [
          {
            id: 'act-1',
            name: 'Hoạt động 1: Mở đầu / Khởi động',
            durationMinutes: 7,
            goal: 'Tạo hứng thú và tình huống có vấn đề',
            content: `Tình huống thực tiễn gắn với ${title}`,
            teacherAction: 'Nêu câu hỏi mở và tổ chức thảo luận',
            studentAction: 'Quan sát và trả lời theo suy nghĩ ban đầu',
            output: 'Học sinh nhận thức được mâu thuẫn nhận thức cần giải quyết'
          },
          {
            id: 'act-2',
            name: 'Hoạt động 2: Hình thành kiến thức mới',
            durationMinutes: 20,
            goal: 'Xây dựng khái niệm và quy luật',
            content: 'Nghiên cứu tài liệu SGK và làm việc nhóm',
            teacherAction: 'Hướng dẫn các nhóm thảo luận và chuẩn hóa kiến thức',
            studentAction: 'Báo cáo sản phẩm nhóm',
            output: 'Ghi nhớ công thức và định luật cốt lõi'
          },
          {
            id: 'act-3',
            name: 'Hoạt động 3: Luyện tập',
            durationMinutes: 12,
            goal: 'Củng cố và áp dụng công thức',
            content: 'Giải bài tập trắc nghiệm và định lượng',
            teacherAction: 'Quan sát và hỗ trợ học sinh gặp khó khăn',
            studentAction: 'Làm bài tập vào vở',
            output: 'Học sinh giải thành thạo các dạng bài cơ bản'
          },
          {
            id: 'act-4',
            name: 'Hoạt động 4: Vận dụng',
            durationMinutes: 6,
            goal: 'Mở rộng và gắn với đời sống thực tế',
            content: 'Bài tập dự án hoặc giải thích hiện tượng đời sống',
            teacherAction: 'Giao nhiệm vụ về nhà',
            studentAction: 'Ghi nhận và lập kế hoạch thực hiện',
            output: 'Bài báo cáo nộp vào tiết sau'
          }
        ],
        assessmentMethod: 'Đánh giá thường xuyên qua phiếu học tập, câu hỏi tương tác và sản phẩm nhóm',
        references: [`SGK Vật lý ${grade || 10} - ${textbook || 'Kết nối tri thức'}`]
      });
    }

    const prompt = `Soạn Kế hoạch bài dạy (Giáo án) môn Vật lý THPT chuẩn Công văn 5512/BGD-ĐT:
Tên bài: ${title}
Khối lớp: ${grade}
Chương: ${chapter}
Bộ sách: ${textbook}
Thời lượng: ${durationPeriods} tiết (mỗi tiết 45 phút)
${customGoals ? `Yêu cầu bổ sung của giáo viên: ${customGoals}` : ''}

Yêu cầu xuất đúng cấu trúc JSON sau (không kèm văn bản thừa):
{
  "title": "${title}",
  "grade": ${grade},
  "chapter": "${chapter}",
  "textbook": "${textbook}",
  "durationPeriods": ${durationPeriods},
  "objectives": {
    "knowledge": ["mục tiêu kiến thức 1", "mục tiêu kiến thức 2"],
    "competencies": ["năng lực đặc thù và chung 1", "năng lực 2"],
    "qualities": ["phẩm chất 1", "phẩm chất 2"]
  },
  "keyKnowledge": ["điểm mấu chốt 1", "điểm mấu chốt 2"],
  "teachingTools": ["thiết bị dạy học 1", "thiết bị dạy học 2"],
  "activities": [
    {
      "id": "act-1",
      "name": "Hoạt động 1: Khởi động",
      "durationMinutes": 7,
      "goal": "Mục tiêu hoạt động",
      "content": "Nội dung hoạt động cụ thể",
      "teacherAction": "Chuyển giao nhiệm vụ học tập của giáo viên",
      "studentAction": "Thực hiện nhiệm vụ học tập của học sinh",
      "output": "Sản phẩm học tập dự kiến"
    },
    {
      "id": "act-2",
      "name": "Hoạt động 2: Hình thành kiến thức mới",
      "durationMinutes": 20,
      "goal": "Mục tiêu",
      "content": "Nội dung",
      "teacherAction": "Hoạt động của giáo viên",
      "studentAction": "Hoạt động của học sinh",
      "output": "Sản phẩm"
    },
    {
      "id": "act-3",
      "name": "Hoạt động 3: Luyện tập",
      "durationMinutes": 12,
      "goal": "Mục tiêu",
      "content": "Nội dung bài tập",
      "teacherAction": "Hoạt động",
      "studentAction": "Hoạt động",
      "output": "Lời giải"
    },
    {
      "id": "act-4",
      "name": "Hoạt động 4: Vận dụng",
      "durationMinutes": 6,
      "goal": "Mục tiêu",
      "content": "Tình huống thực tế",
      "teacherAction": "Giao việc",
      "studentAction": "Thực hiện",
      "output": "Sản phẩm"
    }
  ],
  "assessmentMethod": "Phương pháp và công cụ đánh giá",
  "references": ["Sách giáo khoa", "Tài liệu chuyên môn"]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là chuyên viên phương pháp giảng dạy Vật lý THPT của Bộ Giáo dục và Đào tạo. Hãy soạn giáo án đầy đủ, sư phạm và thực tế theo mẫu 5512.',
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ ...parsed, isDemo: false });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-lesson-plan:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi tạo giáo án' });
  }
});

// 4. AI Generate Slides Outline
apiRouter.post('/ai/generate-slides', async (req: Request, res: Response) => {
  try {
    const { title, grade, chapter, topic, slideCount } = req.body;

    if (!aiClient) {
      return res.json({
        isDemo: true,
        title: title || 'Bài giảng Vật lý',
        grade: grade || 10,
        slideCount: slideCount || 8,
        slides: [
          {
            slideNumber: 1,
            title: `${title} - Vật lý ${grade}`,
            bullets: ['Chương: ' + (chapter || 'Kiến thức cốt lõi'), 'Mục tiêu bài học trọng tâm', 'Tổ chức các hoạt động khám phá'],
            teacherNotes: 'Chào lớp và dẫn nhập bằng một câu hỏi gợi mở thực tế.'
          },
          {
            slideNumber: 2,
            title: 'Hiện tượng thực tế & Câu hỏi Khởi động',
            bullets: ['Quan sát tình huống hàng ngày', 'Tại sao hiện tượng này lại diễn ra?', 'Mối liên hệ giữa lực, vận tốc và năng lượng'],
            teacherNotes: 'Chiếu hình ảnh và dành 1 phút cho học sinh thảo luận cặp đôi.',
            interactiveQuestion: 'Hiện tượng này xảy ra do định luật vật lý nào chi phối?'
          }
        ]
      });
    }

    const prompt = `Soạn dàn ý bài giảng trình chiếu PowerPoint cho tiết học Vật lý THPT:
Tên bài giảng: ${title}
Khối lớp: ${grade}
Chương: ${chapter}
Chủ đề trọng tâm: ${topic}
Số lượng slide mong muốn: ${slideCount || 10}

Yêu cầu xuất đúng cấu trúc JSON sau (không kèm văn bản ngoài JSON):
{
  "title": "${title}",
  "grade": ${grade},
  "chapter": "${chapter}",
  "slideCount": ${slideCount || 10},
  "slides": [
    {
      "slideNumber": 1,
      "title": "Tiêu đề Slide",
      "bullets": ["Ý chính 1", "Ý chính 2", "Ý chính 3"],
      "teacherNotes": "Ghi chú thuyết trình cho giáo viên giảng trên lớp",
      "diagramIdea": "Mô tả hình ảnh hoặc sơ đồ minh họa nên chèn vào slide",
      "interactiveQuestion": "Câu hỏi tương tác ngắn kiểm tra mức độ hiểu bài của học sinh"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là chuyên gia thiết kế bài giảng điện tử EdTech và chuyên gia sư phạm Vật lý THPT.',
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ ...parsed, isDemo: false });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-slides:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi tạo slide' });
  }
});

// 5. AI Generate Assignment
apiRouter.post('/ai/generate-assignment', async (req: Request, res: Response) => {
  try {
    const { grade, topic, difficultyLevel, questionCount } = req.body;

    if (!aiClient) {
      return res.json({
        isDemo: true,
        title: `Bài tập về nhà: ${topic}`,
        description: `Bài tập rèn luyện kỹ năng phân tích và tính toán chuyên đề ${topic}`,
        instructions: 'Trình bày lời giải chi tiết vào vở hoặc gõ trực tiếp câu trả lời. Nêu rõ công thức và đơn vị SI.',
        sampleTeacherSolution: 'Lời giải chi tiết từng bước dành riêng cho giáo viên đối chiếu chấm điểm.',
        questions: [
          {
            code: 'BT-01',
            content: `Bài tập cơ bản về ${topic}`,
            type: 'short_answer',
            level: 'Thông hiểu',
            correctAnswer: 'Đáp án chính xác',
            explanation: 'Phương pháp giải từng bước',
            points: 5
          }
        ]
      });
    }

    const prompt = `Soạn bài tập về nhà môn Vật lý THPT có phân hóa:
Khối lớp: ${grade}
Chủ đề: ${topic}
Mức độ: ${difficultyLevel || 'Phân hóa từ cơ bản đến nâng cao'}
Số câu hỏi: ${questionCount || 4}

Yêu cầu xuất đúng cấu trúc JSON sau (không kèm văn bản thừa):
{
  "title": "Tên bài tập",
  "topic": "${topic}",
  "grade": ${grade},
  "description": "Mô tả yêu cầu và ý nghĩa bài tập",
  "instructions": "Hướng dẫn cụ thể cách làm bài cho học sinh",
  "sampleTeacherSolution": "Đáp án và biểu điểm chi tiết bảo mật dành riêng cho giáo viên",
  "questions": [
    {
      "code": "BT-01",
      "content": "Nội dung câu hỏi",
      "type": "short_answer | multiple_choice | essay",
      "level": "Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao",
      "options": ["A...", "B..."],
      "correctAnswer": "Đáp án",
      "explanation": "Lời giải chi tiết",
      "points": 2.5
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là giáo viên Vật lý THPT luyện thi học sinh giỏi và thi tốt nghiệp.',
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ ...parsed, isDemo: false });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-assignment:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi tạo bài tập' });
  }
});

// 6. AI Analyze Student Performance
apiRouter.post('/ai/analyze-student-performance', async (req: Request, res: Response) => {
  try {
    const { className, studentCount, averageScore, lowCount, midCount, highCount, atRiskStudents } = req.body;

    if (!aiClient) {
      return res.json({
        isDemo: true,
        analysis: `Đánh giá tổng quan lớp ${className || 'học tập'}: Điểm trung bình đạt ${averageScore || 7.5}/10. Đa số học sinh nắm chắc kiến thức cơ bản. Cần chú trọng phụ đạo cho nhóm học sinh còn gặp khó khăn (${lowCount || 1} em) và bổ sung bài toán vận dụng cao cho nhóm khá giỏi (${highCount || 4} em).`,
        recommendations: [
          'Tổ chức 1 buổi chuyên đề củng cố kỹ năng vẽ hình và vectơ lực.',
          'Phân công bạn học khá kèm cặp các học sinh trong danh sách cần hỗ trợ.',
          'Tăng cường các bài trắc nghiệm nhanh 5 phút đầu giờ để củng cố phản xạ.'
        ]
      });
    }

    const prompt = `Hãy đóng vai trò chuyên gia sư phạm phân tích kết quả học tập môn Vật lý của lớp học sau:
- Tên lớp: ${className}
- Sĩ số: ${studentCount}
- Điểm trung bình chung: ${averageScore}
- Phân bố điểm số: Dưới 5: ${lowCount} học sinh; Từ 5 đến dưới 6.5: ${midCount} học sinh; Từ 8 trở lên: ${highCount} học sinh.
- Các học sinh cần hỗ trợ đặc biệt: ${JSON.stringify(atRiskStudents || [])}

Hãy đưa ra nhận xét sư phạm chi tiết:
1. Đánh giá ưu điểm và hạn chế chung của lớp.
2. Nguyên nhân tiềm ẩn dẫn đến điểm số thấp ở nhóm học sinh cần hỗ trợ.
3. Kế hoạch can thiệp sư phạm khả thi trong 2-3 tuần tới cho giáo viên đứng lớp.
4. Nhận xét cá nhân hóa gợi ý cho phụ huynh.

Xuất định dạng JSON:
{
  "summary": "Nhận xét tóm tắt tình hình học tập của lớp",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "actionPlan": ["Biện pháp can thiệp 1", "Biện pháp 2", "Biện pháp 3"],
  "individualAdvice": "Lời khuyên sư phạm cho các học sinh cần lưu ý"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là chuyên gia cố vấn giáo dục và phân tích dữ liệu sư phạm môn Vật lý.',
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ ...parsed, isDemo: false });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-student-performance:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi phân tích dữ liệu học sinh' });
  }
});

// Mount API routes on both /api prefix and root for full Vercel rewrite compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Configure Vite middleware in development or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Physics Teacher Assistant Server is running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone HTTP server when not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Server startup error:', err);
    process.exit(1);
  });
}

export { app };
export default app;
