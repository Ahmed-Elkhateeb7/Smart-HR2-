import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  RotateCcw,
  Calculator,
  Users,
  ShieldCheck,
  Clock,
  HelpCircle
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  PayrollRecord,
  Loan,
  Asset,
  Department
} from '../types';

interface AiAssistantViewProps {
  onApplyJdToOnboarding?: (jdTitle: string) => void;
  employees?: Employee[];
  attendance?: AttendanceRecord[];
  payroll?: PayrollRecord[];
  loans?: Loan[];
  assets?: Asset[];
  departments?: Department[];
  currencySymbol?: string;
}

const INITIAL_BOT_MESSAGE =
  'مرحباً بك في المساعد الذكي التفاعلي لنظام Smart HR! 👋\n\nأنا متصل ببيانات شركتك الحية وجاهز لمساعدتك فوراً في:\n• الاستعلام عن أي موظف بالاسم أو الكود (الراتب، الحضور، السلف، العهد)\n• حساب مكافأة نهاية الخدمة، الساعات الإضافية (Overtime)، التأمينات والضرائب بأي أرقام تكتبها\n• شرح ضوابط الإجازات والجزاءات وفق قانون العمل\n• صياغة الخطابات الرسمية (لفت نظر، إنذار، شهادة خبرة، عقود) وأسئلة المقابلات\n\nاكتب سؤالك بالأسفل أو اختر أحد الاختصارات السريعة للبدء!';

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  employees = [],
  attendance = [],
  payroll = [],
  loans = [],
  assets = [],
  departments = [],
  currencySymbol = 'ج.م',
}) => {
  const [activeTab, setActiveTab] = useState<'jd_generator' | 'chat'>('chat');

  // JD Generator Form State
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [jdResult, setJdResult] = useState<any>(null);
  const [copiedJd, setCopiedJd] = useState(false);

  // Chat Assistant State
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; timestamp?: string }>>([
    {
      sender: 'bot',
      text: INITIAL_BOT_MESSAGE,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingChat]);

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
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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

  const sendMessageText = async (textToSend: string) => {
    const userMsg = textToSend.trim();
    if (!userMsg || isSendingChat) return;

    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const updatedHistory = [...messages, { sender: 'user' as const, text: userMsg, timestamp: nowTime }];

    setMessages(updatedHistory);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: updatedHistory,
          hrContext: {
            employees,
            attendance,
            payroll,
            loans,
            assets,
            departments,
            currencySymbol,
          },
        }),
      });

      const data = await res.json();
      const replyTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply, timestamp: replyTime }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `بخصوص "${userMsg}": يوجد حالياً ${employees.length} موظف مسجل في النظام. يمكنك سؤالي عن بيانات أي موظف بالاسم، أو طلب حساب نهاية الخدمة، التأمينات، الإضافي، أو صياغة خطاب إداري وسأجيبك بالتفصيل.`,
            timestamp: replyTime,
          },
        ]);
      }
    } catch {
      const replyTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `تعذر الاتصال بالخادم حالياً للرد على: "${userMsg}". يرجى المحاولة مرة أخرى بعد لحظات.`,
          timestamp: replyTime,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageText(chatInput);
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: INITIAL_BOT_MESSAGE,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const copyJdToClipboard = () => {
    if (!jdResult) return;
    const textToCopy = `المسمى الوظيفي: ${jdResult.title}\n\nالملخص:\n${jdResult.summary}\n\nالمهام والمسؤوليات:\n${jdResult.responsibilities.map((r: string) => `- ${r}`).join('\n')}\n\nالمهارات المطلوبة:\n${jdResult.requiredSkills.map((s: string) => `- ${s}`).join('\n')}\n\nمؤشرات الأداء KPI's:\n${jdResult.kpis.map((k: string) => `- ${k}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedJd(true);
    setTimeout(() => setCopiedJd(false), 2000);
  };

  const quickPrompts = [
    { label: '📊 إحصائيات الموظفين والرواتب', prompt: 'اعطني ملخص وإحصائيات الموظفين والرواتب في النظام', icon: Users },
    { label: '🧮 حساب نهاية الخدمة', prompt: 'احسب مكافأة نهاية الخدمة لراتب 15000 بعد 7 سنوات خدمة', icon: Calculator },
    { label: '⏱️ حساب الساعات الإضافية', prompt: 'احسب أجر 12 ساعة عمل إضافي لراتب 14000', icon: Clock },
    { label: '🛡️ التأمينات وصافي الراتب', prompt: 'احسب التأمينات الاجتماعية وضريبة كسب العمل لراتب 18000', icon: ShieldCheck },
    { label: '🌴 ضوابط وأرصدة الإجازات', prompt: 'ما هي ضوابط وأرصدة الإجازات السنوية والعارضة والمرضية؟', icon: HelpCircle },
    { label: '📄 نموذج لفت نظر / إنذار', prompt: 'اكتب لي نموذج خطاب لفت نظر رسمي بسبب تكرار التأخير', icon: FileText },
    { label: '📜 نموذج شهادة خبرة', prompt: 'اكتب لي نموذج شهادة خبرة معتمدة لموظف', icon: Award },
    { label: '💳 تقرير السلف والعهد', prompt: 'اعرض لي تقرير السلف النشطة والعهد المسلمة للموظفين', icon: DollarSign },
  ];

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
            محادثة تفاعلية متصلة ببيانات شركتك الحية، حسابات قوانين العمل، وتوليد التوصيف الوظيفي ومؤشرات KPI's.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>مساعد HR الشات التفاعلي</span>
          </button>
          <button
            onClick={() => setActiveTab('jd_generator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'jd_generator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مولد التوصيف الوظيفي</span>
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
                  placeholder="مثال: تكنولوجيا المعلومات، الإدارة المالية"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">مستوى الخبرة المطلوبة</label>
                <input
                  type="text"
                  value={seniorityLevel}
                  onChange={(e) => setSeniorityLevel(e.target.value)}
                  placeholder="مثال: خبرة 3-5 سنوات / مستوى أول"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">مهارات وتقنيات أساسية</label>
                <textarea
                  rows={3}
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  placeholder="افصل بين المهارات بفاصلة..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingJd}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
        /* Interactive Chat Assistant Tab */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col h-[680px]">
          {/* Chat Top Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    مساعد الموارد البشرية الذكي (Smart HR Bot)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    متصل بـ {employees.length} موظف
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  يتفاعل مع أسئلتك الحرة، يحسب المستحقات بالأرقام، ويستعلم عن موظفي النظام لحظياً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetChat}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="بدء محادثة جديدة"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>محادثة جديدة</span>
            </button>
          </div>

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
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white shadow-xs ${
                    msg.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-amber-500 to-indigo-600'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="flex flex-col gap-1 max-w-2xl">
                  <div
                    className={`p-4 rounded-2xl leading-relaxed font-medium whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${msg.sender === 'user' ? 'justify-end' : 'justify-between'}`}>
                    {msg.timestamp && <span>{msg.timestamp}</span>}
                    {msg.sender === 'bot' && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.text, index)}
                        className="hover:text-blue-600 flex items-center gap-1 font-bold cursor-pointer"
                        title="نسخ الرد"
                      >
                        {copiedMsgIdx === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isSendingChat && (
              <div className="flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 w-fit px-4 py-2.5 rounded-2xl border border-blue-100 dark:border-blue-900">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-bold">جاري تحليل سؤالك وإعداد الإجابة...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Quick Action Prompts */}
          <div className="pt-3 pb-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-[11px] no-scrollbar">
              <span className="text-slate-400 font-bold shrink-0 ml-1">اسأل فوراً:</span>
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSendingChat}
                  onClick={() => sendMessageText(item.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 font-bold shrink-0 transition-all cursor-pointer disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اسأل عن اسم موظف، أو اكتب مثلاً: احسب نهاية الخدمة لراتب 20000 بعد 6 سنوات..."
              className="flex-1 p-3.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
            <button
              type="submit"
              disabled={isSendingChat || !chatInput.trim()}
              className="px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>إرسال</span>
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
