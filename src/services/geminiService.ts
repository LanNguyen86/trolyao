export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isDemo?: boolean;
}

export const geminiService = {
  async sendChatMessage(message: string, history: { sender: string; text: string }[] = [], context?: any) {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, context })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lỗi máy chủ (${res.status})`);
      }
      return await res.json();
    } catch (error: any) {
      console.error('Chat error:', error);
      throw error;
    }
  },

  async generateExam(params: {
    grade: number;
    topic: string;
    examType: string;
    questionCount: number;
    essayCount: number;
    cognitiveRequirements?: string;
  }) {
    const res = await fetch('/api/ai/generate-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo đề thi với AI');
    }
    return await res.json();
  },

  async generateLessonPlan(params: {
    title: string;
    grade: number;
    chapter: string;
    textbook: string;
    durationPeriods: number;
    customGoals?: string;
  }) {
    const res = await fetch('/api/ai/generate-lesson-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo giáo án với AI');
    }
    return await res.json();
  },

  async generateSlides(params: {
    title: string;
    grade: number;
    chapter: string;
    topic: string;
    slideCount: number;
  }) {
    const res = await fetch('/api/ai/generate-slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo slide với AI');
    }
    return await res.json();
  },

  async generateAssignment(params: {
    grade: number;
    topic: string;
    difficultyLevel: string;
    questionCount: number;
  }) {
    const res = await fetch('/api/ai/generate-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo bài tập với AI');
    }
    return await res.json();
  },

  async analyzeClassPerformance(params: {
    className: string;
    studentCount: number;
    averageScore: number;
    lowCount: number;
    midCount: number;
    highCount: number;
    atRiskStudents: any[];
  }) {
    const res = await fetch('/api/ai/analyze-student-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi phân tích dữ liệu học sinh');
    }
    return await res.json();
  }
};
