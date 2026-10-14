import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Atom,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  FlaskConical,
  Calculator,
  Compass,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { geminiService, ChatMessage } from '../services/geminiService';
import { GradeLevel, Classroom, Student } from '../types';

interface AIAssistantViewProps {
  classes: Classroom[];
  students: Student[];
  onLog: (action: string, module: string, detail: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  classes,
  students,
  onLog
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Kính chào Thầy/Cô! Tôi là **Trợ lý AI Chuyên gia Vật lý THPT** (sử dụng Gemini 3.8 Flash).\n\nTôi sẵn sàng hỗ trợ Thầy/Cô:\n- 🔬 **Giải thích khái niệm & bản chất hiện tượng:** Cơ học, Nhiệt học, Điện từ, Sóng và Vật lý Hạt nhân (GDPT 2018).\n- 📝 **Giải bài tập mẫu từng bước:** Kiểm tra tính nhất quán của đơn vị SI và điều kiện áp dụng định luật.\n- 🧪 **Gợi ý thí nghiệm trực quan:** Phòng lab thực hành & phần mềm mô phỏng PhET.\n- 💡 **Thiết kế câu hỏi mở & Tình huống thực tiễn:** Khởi động bài học, kiểm tra 5 phút, liên hệ đời sống.\n\nThầy/Cô hãy chọn một chủ đề gợi ý bên dưới hoặc đặt câu hỏi trực tiếp!`,
      timestamp: 'Vừa xong'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [targetGrade, setTargetGrade] = useState<GradeLevel>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const promptSuggestions = [
    {
      label: 'Giải bài tập chuyển động biến đổi đều từng bước',
      prompt: 'Hướng dẫn giải chi tiết bài toán: Một đoàn tàu đang chạy với tốc độ 72 km/h thì hãm phanh chuyển động chậm dần đều với gia tốc a = -0.5 m/s². Tính quãng đường tàu đi được từ khi hãm phanh đến khi dừng lại hẳn?'
    },
    {
      label: 'Giải thích hiện tượng Cực quang (Vật lý 12)',
      prompt: 'Giải thích ngắn gọn, sư phạm cho học sinh lớp 12 về hiện tượng Cực quang (Aurora) và vai trò của từ trường Trái Đất trong việc làm lệch quỹ đạo các hạt mang điện từ gió Mặt Trời.'
    },
    {
      label: 'Gợi ý thí nghiệm con lắc lò xo (Vật lý 11)',
      prompt: 'Gợi ý một hoạt động thí nghiệm đơn giản trong lớp học Vật lý 11 để học sinh tự chứng minh chu kỳ dao động con lắc lò xo T = 2π√(m/k) không phụ thuộc vào biên độ dao động.'
    },
    {
      label: 'Kiểm tra đơn vị SI & Thứ nguyên công thức',
      prompt: 'Hãy kiểm tra tính đồng nhất về thứ nguyên của công thức động năng Wđ = 1/2 m v² và công cơ học A = F.s trong hệ đơn vị SI chuẩn quốc tế.'
    }
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        sender: m.sender === 'user' ? 'Giáo viên' : 'Trợ lý AI',
        text: m.text
      }));

      const context = {
        targetGrade,
        classesCount: classes.length,
        schoolYear: '2026-2027'
      };

      const result = await geminiService.sendChatMessage(textToSend, history, context);

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: result.reply || 'Không có phản hồi từ máy chủ.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isDemo: result.isDemo
      };

      setMessages((prev) => [...prev, aiMsg]);
      onLog('Hỏi Trợ lý AI', 'Trợ lý AI', `Câu hỏi: ${textToSend.slice(0, 40)}...`);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: `⚠️ **Lỗi kết nối AI:** ${err.message || 'Không thể gửi yêu cầu đến Gemini AI'}. Vui lòng thử lại sau giây lát.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Xóa toàn bộ lịch sử trò chuyện hiện tại?')) {
      setMessages([
        {
          id: 'msg-init-new',
          sender: 'assistant',
          text: 'Đã làm mới phiên hỏi đáp. Thầy/Cô có câu hỏi nào mới về chương trình Vật lý THPT không ạ?',
          timestamp: 'Vừa xong'
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-195px)] md:h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top AI Studio Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 shadow-md shrink-0">
            <Atom className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base md:text-lg">Trợ lý AI Vật lý THPT</h3>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.2 rounded-full font-bold">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 truncate">
              Kiến thức chuẩn GDPT 2018 • Kiểm tra đơn vị SI • Gợi ý sư phạm
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Target Grade Selector */}
          <select
            value={targetGrade}
            onChange={(e) => setTargetGrade(Number(e.target.value) as GradeLevel)}
            className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-semibold cursor-pointer"
          >
            <option value={10}>Ưu tiên Khối 10</option>
            <option value={11}>Ưu tiên Khối 11</option>
            <option value={12}>Ưu tiên Khối 12</option>
          </select>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Làm mới cuộc trò chuyện"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-700 text-white'
                    : 'bg-indigo-900 text-amber-400 ring-2 ring-amber-400/30'
                }`}
              >
                {isUser ? 'GV' : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed relative group shadow-2xs ${
                  isUser
                    ? 'bg-blue-700 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.isDemo && (
                  <span className="inline-block text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded mb-2">
                    Mô phỏng mẫu (Chưa cấu hình GEMINI_API_KEY)
                  </span>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className="mt-2 pt-2 border-t border-slate-100/30 flex items-center justify-between text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              Trợ lý AI đang tra cứu kiến thức vật lý và tính toán lời giải...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 bg-white border-t border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">Gợi ý nhanh:</span>
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.prompt)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Hỏi về công thức, bài tập, thí nghiệm vật lý, hoặc phân tích lớp học..."
            className="flex-1 p-2.5 text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gửi câu hỏi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
