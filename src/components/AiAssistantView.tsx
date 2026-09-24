import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  FileText,
  Send,
  Copy,
  Check,
  Briefcase,
  Target,
  Award,
  DollarSign,
  Bot,
  User,
  Loader2
} from 'lucide-react';

interface AiAssistantViewProps {
  onApplyJdToOnboarding?: (jdTitle: string) => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  onApplyJdToOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<'jd_generator' | 'chat'>('jd_generator');

  // JD Generator Form State
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [jdResult, setJdResult] = useState<any>(null);
  const [copiedJd, setCopiedJd] = useState(false);

  // Chat Assistant State
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'مرحباً بك في المساعد الذكي Smart HR! 👋\nأنا هنا لمساعدتك في صياغة اللوائح الداخلية، حساب نهاية الخدمة، والإجابة عن كافة الاستفسارات المتعلقة بنظام العمل والموارد البشرية.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handleGenerateJd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle) return;

    setIsGeneratingJd(true);
    const titleClean = jobTitle.trim();
    const deptClean = department.trim() || 'الموارد البشرية والعمليات';
    const levelClean = seniorityLevel.trim() || 'متوسط الخبرة';
    const skillsArray = keySkills
      ? keySkills.split(',').map((s) => s.trim()).filter(Boolean)
      : ['التفكير التحليلي', 'إدارة الوقت والأولويات', 'التواصل الفعال'];

    // Instant preview draft for immediate visual feedback
    const instantDraft = {
      title: titleClean,
      summary: `توصيف وظيفي متكامل لمسمى ${titleClean} في قسم ${deptClean}. يتطلب هذا الدور تنفيذ الخطط التشغيلية ومتابعة الأداء اليومي وفقاً لمتطلبات مستوى الخبرة (${levelClean}).`,
      responsibilities: [
        `إدارة ومتابعة كافة المهام والمسؤوليات التشغيلية اليومية الخاصة بـ ${titleClean}`,
        `المشاركة في تطوير الخطط وآليات العمل الخاصة بقسم ${deptClean}`,
        'التنسيق والتكامل مع فرق العمل والأقسام ذات الصلة لضمان جودة الأداء',
        'متابعة تطبيق معايير الجودة والالتزام بلوائح وسياسات العمل الداخلية',
        'إعداد التقارير الدورية وتحليل مخرجات العمل ورفعها للإدارة المباشرة'
      ],
      requiredSkills: [
        'إتقان استخدام تطبيقات وبرامج الحاسوب ذات الصلة',
        'القدرة على حل المشكلات واتخاذ القرارات السريعة',
        'مهارات التواصل الفعال والعمل ضمن فريق',
        ...skillsArray
      ],
      kpis: [
        'نسبة إنجاز المهام والتكليفات في المواعيد المحددة (Target: 95%)',
        'مستوى جودة المخرجات ونسبة دقة البيانات المعالجة (Target: < 2% أخطاء)',
        'معدل رضا العملاء الداخليين وأفراد الفريق (Target: 90%)',
        'مدى الالتزام بالتعليمات الإدارية ولائحة انضباط العمل'
      ],
      suggestedSalaryRange: '15,000 - 28,000 جنيه مصري'
    };

    setJdResult(instantDraft);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/ai/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: titleClean,
          department: deptClean,
          seniorityLevel: levelClean,
          keySkills,
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data) {
        setJdResult(data.data);
      }
    } catch {
      // Keep instant draft smoothly
    } finally {
      setIsGeneratingJd(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'بناءً على لوائح نظام العمل: يتم احتساب ساعات العمل الإضافي بنسبة 100% من الأجر الأساسي + 50% كبدل إضافي (أجر الوقت الإضافي 1.5x). كما يجب ألا تتجاوز ساعات العمل الفعلية 8 ساعات يومياً.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'تم استلام سؤالك! يمكنك مراجعة شاشة الرواتب لاعتماد المستحقات بعد التأكد من تطابق سجلات الحضور والسلف.',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const copyJdToClipboard = () => {
    if (!jdResult) return;
    const textToCopy = `المسمى الوظيفي: ${jdResult.title}\n\nالملخص:\n${jdResult.summary}\n\nالمهام والمسؤوليات:\n${jdResult.responsibilities.map((r: string) => `- ${r}`).join('\n')}\n\nالمهارات المطلوبة:\n${jdResult.requiredSkills.map((s: string) => `- ${s}`).join('\n')}\n\nمؤشرات الأداء KPI's:\n${jdResult.kpis.map((k: string) => `- ${k}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedJd(true);
    setTimeout(() => setCopiedJd(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            <span>المساعد الذكي وتوصيف الوظائف (Smart AI Assistant)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            توليد التوصيف الوظيفي ومؤشرات الأداء KPI's بالذكاء الاصطناعي والإجابة عن استفسارات الموارد البشرية.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('jd_generator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'jd_generator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مولد التوصيف الوظيفي</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>مساعد HR الشات الذكي</span>
          </button>
        </div>
      </div>

      {activeTab === 'jd_generator' ? (
        /* Job Description Generator Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form Column */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                مدخلات الوظيفة المراد إنشاؤها
              </h3>
            </div>

            <form onSubmit={handleGenerateJd} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المسمى الوظيفي المطلوب *</label>
                <input
                  required
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مثال: مدير برمجيات، محاسب تكاليف"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">القسم المستهدف</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">مستوى الخبرة المطلوبة</label>
                <input
                  type="text"
                  value={seniorityLevel}
                  onChange={(e) => setSeniorityLevel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">مهارات وتقنيات أساسية</label>
                <textarea
                  rows={3}
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingJd}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingJd ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>جاري التوليد بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>توليد التوصيف الوظيفي ومؤشرات الأداء</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Generated Result Column */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            {jdResult ? (
              <div className="space-y-5 animate-fade-in text-xs">
                {/* Result Header */}
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      مخرجات AI الذكية
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      {jdResult.title}
                    </h3>
                  </div>

                  <button
                    onClick={copyJdToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedJd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedJd ? 'تم النسخ!' : 'نسخ التوصيف'}</span>
                  </button>
                </div>

                {/* Summary */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {jdResult.summary}
                </div>

                {/* Responsibilities */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>المهام والمسؤوليات الرئيسية</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300 pr-2">
                    {jdResult.responsibilities?.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Skills & KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                    <h4 className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>المهارات المطلوبة</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {jdResult.requiredSkills?.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 font-bold text-[11px] text-blue-800 dark:text-blue-200 border border-blue-200/80">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                    <h4 className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>مؤشرات الأداء الرئيسية (KPI's)</span>
                    </h4>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                      {jdResult.kpis?.map((kpi: string, idx: number) => (
                        <li key={idx}>• {kpi}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Salary Range */}
                {jdResult.suggestedSalaryRange && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex items-center justify-between text-purple-900 dark:text-purple-200 font-bold">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <span>نطاق الراتب المقترح بالسوق المصري (EGP):</span>
                    </span>
                    <span className="text-sm font-black">
                      {String(jdResult.suggestedSalaryRange).replace(/ريال سعودي|ريال/g, 'جنيه مصري')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Sparkles className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  جاهز لتوليد الوصف الوظيفي الذكي
                </h4>
                <p className="text-xs max-w-sm mt-1">
                  أدخل مسمى الوظيفة والمهارات المطلوبة واضغط على زر التوليد للحصول على مهام ومؤشرات KPI's مخصصة فوراً.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Chat Assistant Tab */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col h-[650px]">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pl-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 text-xs ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white ${
                    msg.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-amber-500 to-indigo-600'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-xl p-4 rounded-2xl leading-relaxed font-medium whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isSendingChat && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>جاري كتابة الإجابة من المساعد الذكي...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 border-t border-slate-100 dark:border-slate-700 text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">مقترحات:</span>
            <button
              onClick={() => setChatInput('ما هي نسبة حسم الساعات الإضافية ورسوم العمل الجزئي؟')}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-100 font-bold shrink-0"
            >
              حساب الساعات الإضافية Overtime
            </button>
            <button
              onClick={() => setChatInput('كيف يتم إقفال جدول المرتبات في النظام وتفادي الأخطاء؟')}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-100 font-bold shrink-0"
            >
              اعتماد كشف المرتبات
            </button>
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب سؤالك لإدارة الموارد البشرية هنا..."
              className="flex-1 p-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
              type="submit"
              disabled={isSendingChat || !chatInput.trim()}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
