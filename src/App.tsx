/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  FileText, 
  Play, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Home, 
  User, 
  Hash,
  Loader2,
  Trophy,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, Quiz, QuizAttempt } from './types.ts';
import { extractTextFromWord, exportQuizToExcel, shuffleArray } from './services/fileProcessing.ts';
import { generateEnhancedQuiz } from './services/gemini.ts';

type View = 'start' | 'create' | 'take-preview' | 'taking' | 'result';

export default function App() {
  const [view, setView] = useState<View>('start');
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizCode, setQuizCode] = useState('');
  const [userName, setUserName] = useState('');
  const [savedQuizzes, setSavedQuizzes] = useState<{ [id: string]: Quiz }>({});
  
  const [newQuizQuestions, setNewQuizQuestions] = useState<Question[]>([]);
  const [newQuizTitle, setNewQuizTitle] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [id: string]: string }>({});
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('quizmaster_quizzes');
    if (saved) {
      setSavedQuizzes(JSON.parse(saved));
    }
  }, []);

  const saveQuiz = (quiz: Quiz) => {
    const updated = { ...savedQuizzes, [quiz.id]: quiz };
    setSavedQuizzes(updated);
    localStorage.setItem('quizmaster_quizzes', JSON.stringify(updated));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await extractTextFromWord(file);
      const enhanced = await generateEnhancedQuiz(text);
      
      const formatted: Question[] = enhanced.map((q) => {
        const distractors = q.distractors || [];
        const correctAnswer = q.correctAnswer || '';
        const options = shuffleArray([correctAnswer, ...distractors]);
        return {
          id: crypto.randomUUID(),
          question: q.question || '',
          correctAnswer,
          distractors,
          options,
          explanation: q.explanation || ''
        };
      });

      setNewQuizQuestions(formatted);
      setNewQuizTitle(file.name.replace(/\.[^/.]+$/, ""));
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi xử lý file. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeQuiz = () => {
    if (!newQuizTitle) {
      alert("Vui lòng nhập tiêu đề bài tập.");
      return;
    }
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const quiz: Quiz = {
      id,
      title: newQuizTitle,
      questions: newQuizQuestions,
      createdAt: Date.now()
    };
    saveQuiz(quiz);
    setCurrentQuiz(quiz);
    setView('start');
    alert(`Đã lưu bài tập với mã: ${id}`);
  };

  const startQuiz = () => {
    const quiz = savedQuizzes[quizCode];
    if (!quiz) {
      alert("Không tìm thấy mã bài tập này.");
      return;
    }
    if (!userName.trim()) {
      alert("Vui lòng nhập họ và tên.");
      return;
    }
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setView('taking');
  };

  const submitQuiz = () => {
    if (!currentQuiz) return;
    
    let score = 0;
    currentQuiz.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const result: QuizAttempt = {
      userName,
      quizId: currentQuiz.id,
      score,
      total: currentQuiz.questions.length,
      answers: userAnswers,
      timestamp: Date.now()
    };

    setAttemptResult(result);
    setView('result');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('start')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">Q</div>
          <span className="text-xl font-bold tracking-tight">QuizFlow <span className="text-indigo-600">AI</span></span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
          <button onClick={() => setShowGuide(true)} className="hover:text-indigo-600 transition-colors">Hướng dẫn</button>
          <button onClick={() => setView('create')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">Tạo mới</button>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-full">AI-Powered Learning</span>
                  <h2 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
                    Học tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">hiệu quả hơn</span> cùng AI.
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                    Chỉ cần tải lên file Word câu hỏi, chúng tôi sẽ giúp bạn hoàn thiện bài trắc nghiệm với các phương án gây nhiễu và giải thích chi tiết.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setView('create')} className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-100">
                    <Plus size={20} /> Tạo bài tập mới
                  </button>
                  <button 
                    onClick={() => {
                      const code = window.prompt("Nhập mã bài tập:");
                      if (code) setQuizCode(code.toUpperCase());
                    }}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl border-2 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <Play size={20} /> Làm bài tập
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Làm nhanh bài tập</h3>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <Hash size={20} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Mã bài tập</label>
                    <input type="text" value={quizCode} onChange={(e) => setQuizCode(e.target.value.toUpperCase())} placeholder="VD: ABCD12" className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Họ và tên người làm</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
                  </div>
                  <button onClick={startQuiz} disabled={!quizCode || !userName} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group transition-all">
                    Bắt đầu làm bài <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-4xl font-extrabold tracking-tight">Tạo bài tập mới</h2>
                <p className="text-gray-500">Tải lên tài liệu Word (docx) chứa danh sách câu hỏi và đáp án gốc.</p>
              </div>

              {!newQuizQuestions.length ? (
                <div className="max-w-xl mx-auto">
                  <div className={`relative group p-12 bg-white border-2 border-dashed border-slate-200 rounded-[32px] hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center ${loading ? 'pointer-events-none' : ''}`}>
                    <input type="file" accept=".docx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        {loading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-800">Tải lên File Word (.docx)</p>
                        <p className="text-sm text-slate-400">Chứa câu hỏi và đáp án gốc</p>
                      </div>
                      <button className="text-xs font-bold text-indigo-600 border border-indigo-200 px-6 py-2 rounded-full hover:bg-indigo-100 transition-colors">Chọn tệp tin</button>
                    </div>
                  </div>
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-6 bg-indigo-50 rounded-2xl flex items-center gap-4 border border-indigo-100">
                      <Loader2 size={20} className="text-indigo-600 animate-spin" />
                      <p className="text-sm font-semibold text-indigo-700">AI đang xử lý bộ câu hỏi...</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-6 items-end justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiêu đề bài tập</label>
                      <input type="text" value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} className="w-full text-xl font-bold text-slate-800 border-none focus:ring-0 outline-none p-0 transition-all" />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button onClick={() => exportQuizToExcel(newQuizTitle, newQuizQuestions)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                        <Download size={18} /> Xuất Excel
                      </button>
                      <button onClick={finalizeQuiz} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                        <CheckCircle size={18} /> Lưu bài
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {newQuizQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <span className="flex-shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">CÂU {String(idx + 1).padStart(2, '0')}</span>
                            <p className="text-lg font-bold text-slate-800 pt-1">{q.question}</p>
                          </div>
                          <button onClick={() => setNewQuizQuestions(p => p.filter(item => item.id !== q.id))} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="p-4 border border-indigo-500 bg-indigo-50 rounded-2xl flex items-center gap-3">
                            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                            <span className="text-sm font-semibold text-indigo-900">{q.correctAnswer}</span>
                          </div>
                          {q.distractors.map((d, dIdx) => (
                            <div key={dIdx} className="p-4 border border-slate-200 rounded-2xl flex items-center gap-3 opacity-60 italic">
                               <div className="w-6 h-6 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-bold text-sm">✕</div>
                               <span className="text-sm text-slate-700">{d}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Giải thích</span>
                          <p className="text-xs text-slate-600 leading-relaxed italic">{q.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'taking' && currentQuiz && (
            <motion.div key="taking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{currentQuiz.title}</h2>
                  <p className="text-sm text-gray-400">Người làm: <span className="font-bold text-gray-900">{userName}</span></p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold">{currentQuestionIndex + 1} / {currentQuiz.questions.length}</div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }} className="h-full bg-indigo-600" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={currentQuiz.questions[currentQuestionIndex].id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white p-8 md:p-12 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">CÂU {String(currentQuestionIndex + 1).padStart(2, '0')}</span>
                  <p className="text-2xl font-bold text-slate-800 text-center leading-relaxed">{currentQuiz.questions[currentQuestionIndex].question}</p>
                  <div className="grid gap-3">
                    {currentQuiz.questions[currentQuestionIndex].options.map((option, oIdx) => (
                      <button key={oIdx} onClick={() => setUserAnswers(p => ({ ...p, [currentQuiz.questions[currentQuestionIndex].id]: option }))} className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-semibold flex items-center justify-between group ${userAnswers[currentQuiz.questions[currentQuestionIndex].id] === option ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 hover:border-indigo-400'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${userAnswers[currentQuiz.questions[currentQuestionIndex].id] === option ? 'bg-white/20' : 'bg-white border border-slate-200'}`}>{String.fromCharCode(65 + oIdx)}</span>
                          {option}
                        </div>
                        {userAnswers[currentQuiz.questions[currentQuestionIndex].id] === option && <CheckCircle size={18} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-between gap-4">
                <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(p => p - 1)} className="px-8 py-4 bg-white text-gray-400 font-bold rounded-2xl border border-gray-100 disabled:opacity-30 transition-all">Quay lại</button>
                {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
                  <button onClick={submitQuiz} disabled={Object.keys(userAnswers).length < currentQuiz.questions.length} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">Nộp bài</button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={!userAnswers[currentQuiz.questions[currentQuestionIndex].id]} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">Câu tiếp theo</button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'result' && attemptResult && currentQuiz && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-12">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-indigo-600 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200"><Trophy size={60} /></div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 text-white rounded-2xl flex items-center justify-center font-black">{Math.round((attemptResult.score / attemptResult.total) * 100)}%</div>
                </div>
                <h2 className="text-4xl font-black">Kết quả</h2>
                <p className="text-gray-500">Chúc mừng <span className="font-bold text-gray-900">{attemptResult.userName}</span> đã hoàn thành bài tập.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => { setView('taking'); setCurrentQuestionIndex(0); setUserAnswers({}); }} className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2"><RefreshCw size={20} /> Làm lại</button>
                <button onClick={() => setView('start')} className="flex-1 py-4 bg-white text-gray-900 font-bold rounded-2xl border-2 border-gray-100 flex items-center justify-center gap-2"><Home size={20} /> Trang chủ</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 px-6 border-t border-gray-100 text-center space-y-4">
        <p className="text-gray-400 text-sm">
          © 2026 QuizFlow AI. Ứng dụng này được phát triển bởi <strong>Phạm Thanh Tùng</strong> nhằm mục đích hỗ trợ học tập hiệu quả hơn cùng công nghệ AI hiện đại!
        </p>
      </footer>

      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
              <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
              <h3 className="text-2xl font-black text-indigo-600">Cách sử dụng QuizFlow AI</h3>
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed text-left">
                <p><strong>1. Tạo bài:</strong> Nhấn "Tạo bài tập mới" và tải file Word (.docx) chứa câu hỏi của bạn lên.</p>
                <p><strong>2. AI xử lý:</strong> Gemini sẽ tự động tạo thêm các đáp án nhiễu và viết lời giải chi tiết.</p>
                <p><strong>3. Làm bài:</strong> Nhập tên và Mã bài tập để bắt đầu ôn luyện.</p>
                <p><strong>4. Kết quả:</strong> Sau khi xong, bạn có thể xem giải thích từng câu và xuất file Excel.</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg">Đã hiểu</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
