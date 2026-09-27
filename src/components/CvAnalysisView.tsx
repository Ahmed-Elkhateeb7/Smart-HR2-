import React, { useState, useRef } from 'react';
import {
  FileSearch,
  Upload,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Mail,
  Phone,
  Search,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Percent,
  FileCode,
  Users,
  UserPlus,
  X,
  Building2,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { AtsCandidate, AtsAnalysisResult, UploadedCvFile, Employee } from '../types';

interface CvAnalysisViewProps {
  onAddEmployee?: (newEmp: Employee) => void;
  onNavigateTab?: (tab: string) => void;
}

export const CvAnalysisView: React.FC<CvAnalysisViewProps> = ({ onAddEmployee, onNavigateTab }) => {
  // Free Job Description & Requirements Builder State
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  
  // Free Key Requirements & Skills tags
  const [requirementsList, setRequirementsList] = useState<string[]>([]);
  const [newRequirementInput, setNewRequirementInput] = useState('');

  // Uploaded real files state (starts completely empty, no mock/demo data)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedCvFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AtsAnalysisResult | null>(null);
  const [analysisEngine, setAnalysisEngine] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Results view controls
  const [searchFilter, setSearchFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [addedEmployeeSuccess, setAddedEmployeeSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add requirement tag freely
  const handleAddRequirement = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newRequirementInput.trim();
    if (!trimmed) return;
    if (!requirementsList.includes(trimmed)) {
      setRequirementsList(prev => [...prev, trimmed]);
    }
    setNewRequirementInput('');
  };

  // Remove requirement tag
  const handleRemoveRequirement = (indexToRemove: number) => {
    setRequirementsList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Clear all job description fields
  const handleClearJobForm = () => {
    if (confirm('هل ترغب في تفريغ بيانات الوصف الوظيفي والمتطلبات والبدء من جديد؟')) {
      setJobTitle('');
      setDepartment('');
      setExperienceLevel('');
      setResponsibilitiesText('');
      setRequirementsList([]);
      setNewRequirementInput('');
    }
  };

  // Build the complete combined Job Description payload
  const buildCombinedJobDescription = (): string => {
    const parts: string[] = [];

    if (jobTitle.trim()) {
      parts.push(`- المسمى الوظيفي المطلوب: ${jobTitle.trim()}`);
    }
    if (department.trim()) {
      parts.push(`- القسم / الإدارة: ${department.trim()}`);
    }
    if (experienceLevel.trim()) {
      parts.push(`- مستوى وسنوات الخبرة المطلوبة: ${experienceLevel.trim()}`);
    }
    if (responsibilitiesText.trim()) {
      parts.push(`\n- بطاقة الوصف والمهام والمسؤوليات:\n${responsibilitiesText.trim()}`);
    }
    if (requirementsList.length > 0) {
      parts.push(`\n- المتطلبات والمهارات الأساسية الإلزامية:\n${requirementsList.map((req, i) => `  ${i + 1}. ${req}`).join('\n')}`);
    }

    return parts.join('\n');
  };

  // Handle genuine file uploads (PDF & Docs)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedCvFile[] = [];

    (Array.from(files) as File[]).forEach((file: File) => {
      const fileId = `cv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      const cvItem: UploadedCvFile = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
        uploadedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        status: 'ready',
      };

      // Read file content
      const reader = new FileReader();
      if (isPdf) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setUploadedFiles(prev =>
              prev.map(f => f.id === fileId ? { ...f, base64: reader.result as string } : f)
            );
          }
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setUploadedFiles(prev =>
              prev.map(f => f.id === fileId ? { ...f, text: reader.result as string } : f)
            );
          }
        };
      }

      newFiles.push(cvItem);
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrorMsg(null);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAllFiles = () => {
    setUploadedFiles([]);
    setAnalysisResult(null);
  };

  // Run ATS Analysis
  const handleStartAtsAnalysis = async () => {
    const fullJobDescription = buildCombinedJobDescription();

    if (!fullJobDescription.trim()) {
      setErrorMsg('يرجى كتابة المسمى الوظيفي أو إدخال الوصف الوظيفي والمتطلبات لبدء التحليل والمقارنة.');
      return;
    }

    if (uploadedFiles.length === 0) {
      setErrorMsg('يرجى رفع ملفات السير الذاتية (PDF) للمتقدمين أولاً لتنفيذ الفرز.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep('جاري قراءة واستخراج البيانات من ملفات PDF المرفوعة...');

    try {
      const stepTimer1 = setTimeout(() => {
        setAnalysisStep('جاري مطابقة المهارات التقنية والشخصية (Skills Match) مع الوصف والمتطلبات المدخلة...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setAnalysisStep('جاري تدقيق الخبرات العملية والمؤهلات الأكاديمية وحساب نسب التوافق (Match Score)...');
      }, 2500);

      const payloadCandidates = uploadedFiles.map(f => ({
        id: f.id,
        fileName: f.fileName,
        fileSize: f.fileSize,
        base64: f.base64,
        text: f.text,
      }));

      const res = await fetch('/api/ai/analyze-cvs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: fullJobDescription,
          candidates: payloadCandidates
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر استكمال تحليل السير الذاتية عبر الخادم.');
      }

      setAnalysisResult({
        total_analyzed: data.total_analyzed || uploadedFiles.length,
        top_candidates: data.top_candidates || [],
        analyzed_at: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        job_title: jobTitle || 'وظيفة معتمدة',
        job_description_snippet: fullJobDescription.slice(0, 150) + '...'
      });
      setAnalysisEngine(data.engine || 'ATS Intelligent Engine');

    } catch (err: any) {
      console.error('Error during ATS analysis:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إجراء الفرز والتحليل.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Quick Onboard: convert ATS Candidate to Employee
  const handleQuickOnboard = (candidate: AtsCandidate) => {
    if (!onAddEmployee) {
      alert(`تم نسخ بيانات المرشح (${candidate.full_name}) لتسجيله في النظام.`);
      return;
    }

    const newEmpId = `emp-${Date.now()}`;
    const newEmpCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmployee: Employee = {
      id: newEmpId,
      employeeCode: newEmpCode,
      name: candidate.full_name,
      position: jobTitle.trim() || 'موظف معتمد',
      department: department.trim() || 'الإدارة العامة',
      email: candidate.email && candidate.email !== 'غير متوفر في المستند' ? candidate.email : `emp.${Math.floor(Math.random() * 999)}@company.com`,
      phone: candidate.phone && candidate.phone !== 'غير متوفر في المستند' ? candidate.phone : '01012345678',
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
      baseSalary: 18000,
      housingAllowance: 2500,
      transportAllowance: 1000,
      otherAllowances: 500,
      gosiInsurance: 1980,
      iqamaOrIdNumber: `29${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      iqamaExpiryDate: '2028-12-31',
      contractType: 'دوام كامل',
      contractExpiryDate: '2027-12-31',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      bankAccount: `EG${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
      bankName: 'البنك الأهلي المصري'
    };

    onAddEmployee(newEmployee);
    setAddedEmployeeSuccess(`تمت إضافة المرشح (${candidate.full_name}) كـ موظف رسمي في النظام برقم كود: ${newEmpCode}!`);
    setTimeout(() => setAddedEmployeeSuccess(null), 5000);
  };

  // Copy standard JSON output matching user's exact specification
  const handleCopyStandardJson = () => {
    if (!analysisResult) return;
    const jsonOutput = JSON.stringify({
      total_analyzed: analysisResult.total_analyzed,
      top_candidates: analysisResult.top_candidates
    }, null, 2);

    navigator.clipboard.writeText(jsonOutput);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // Filter candidates
  const filteredCandidates = (analysisResult?.top_candidates || []).filter(c => {
    const matchesSearch = 
      c.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.candidate_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.ai_summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.key_strengths.some(s => s.toLowerCase().includes(searchFilter.toLowerCase()));

    if (!matchesSearch) return false;

    if (scoreFilter === 'high') return c.match_percentage >= 85;
    if (scoreFilter === 'medium') return c.match_percentage >= 70 && c.match_percentage < 85;
    if (scoreFilter === 'low') return c.match_percentage < 70;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Top Banner / ATS Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Senior Technical Recruiter & ATS AI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
                تحليل ملفات PDF المباشرة
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-semibold">
                فرز واختيار أفضل 10 مرشحين
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <FileSearch className="w-8 h-8 text-blue-300" />
              <span>نظام فرز وتحليل السير الذاتية (CVs ATS)</span>
            </h1>

            <p className="text-sm text-blue-100/90 max-w-3xl leading-relaxed">
              قم بإدخال بيانات الوصف الوظيفي والمتطلبات بحرية تامة، ثم ارفع ملفات السير الذاتية (PDF) للمتقدمين؛ وسيقوم النظام الذكي بإجراء فحص موضوعي ومطابقة دقيقة لاختيار وترتيب أفضل 10 مرشحين وفق معايير ATS الاحترافية.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleStartAtsAnalysis}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'جاري الفرز والتحليل...' : 'بدء الفرز واختيار أفضل 10 مرشحين'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Added Employee Notification Alert */}
      {addedEmployeeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between gap-3 shadow-sm animate-bounce-short">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{addedEmployeeSuccess}</span>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('employees')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              عرض قائمة الموظفين
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Free Job Description & Requirements Builder (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  الوصف الوظيفي ومتطلبات العمل (إضافة حرة)
                </h2>
                <span className="text-[10px] text-slate-400">
                  حدد متطلباتك ومسؤوليات الوظيفة بحرية تامة لمطابقتها مع السير الذاتية
                </span>
              </div>
            </div>

            {(jobTitle || department || experienceLevel || responsibilitiesText || requirementsList.length > 0) && (
              <button
                type="button"
                onClick={handleClearJobForm}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                title="تفريغ الحقول"
              >
                مسح الحقول
              </button>
            )}
          </div>

          {/* Job Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                المسمى الوظيفي *
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مثال: مهندس برمجيات، محاسب..."
                  className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                القسم / الإدارة
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="مثال: التقنية، المالية..."
                  className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                سنوات الخبرة المطلوبة
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  placeholder="مثال: 3-5 سنوات / حديث تخرج"
                  className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Job Description & Responsibilities Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                الوصف الوظيفي والمهام والمسؤوليات
              </label>
              <span className="text-[10px] text-slate-400">
                {responsibilitiesText.length} حرف
              </span>
            </div>
            <textarea
              value={responsibilitiesText}
              onChange={(e) => setResponsibilitiesText(e.target.value)}
              placeholder="اكتب أو الصق المهام والمسؤوليات اليومية المطلوبة من شاغل الوظيفة بالتفصيل..."
              rows={4}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* Key Requirements & Skills: Free Interactive Tag Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>المتطلبات والمهارات الأساسية (إضافة حرة للبنود):</span>
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                {requirementsList.length} متطلب مضاف
              </span>
            </div>

            {/* Input + Add button for requirements */}
            <form onSubmit={handleAddRequirement} className="flex items-center gap-2">
              <input
                type="text"
                value={newRequirementInput}
                onChange={(e) => setNewRequirementInput(e.target.value)}
                placeholder="أضف مهارة أو متطلب (مثال: إتقان React، شهادة PMP، لغة إنجليزية...) ثم اضغط إضافة"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </form>

            {/* Requirements Tags Cloud */}
            <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80">
              {requirementsList.length === 0 ? (
                <span className="text-[11px] text-slate-400 py-1 px-2 italic">
                  لم تقم بإضافة متطلبات محددة بعد. يمكنك إضافة أي مهارات تقنية أو لغات أو شهادات أعلاه.
                </span>
              ) : (
                requirementsList.map((req, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100/80 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-xs font-bold border border-blue-200 dark:border-blue-800"
                  >
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="حذف هذا المتطلب"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Genuine CVs Upload (PDF & Docs) (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  ملفات السير الذاتية المرفوعة (PDF)
                </h2>
                <span className="text-[10px] text-slate-400">
                  {uploadedFiles.length} سيرة ذاتية مرفوعة وجاهزة للفرز
                </span>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFiles}
                className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold hover:bg-rose-100 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح كل الملفات</span>
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50/30 transition-all text-center cursor-pointer group flex flex-col items-center justify-center space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                اضغط لاختيار أو سحب وإفلات ملفات السير الذاتية (PDF / DOCX)
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                يمكنك تحديد ملف واحد أو عشرات الملفات دفعة واحدة؛ سيقوم المحرك بقراءتها وفحصها آلياً.
              </p>
            </div>
            <div className="pt-1">
              <span className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                يدعم صيغ PDF، DOCX، TXT
              </span>
            </div>
          </div>

          {/* Uploaded Files List */}
          <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 pr-1">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs space-y-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                <FileText className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <p className="font-bold text-slate-600 dark:text-slate-300">
                  لم يتم رفع أي ملفات حتى الآن.
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  ارفع السير الذاتية الخاصة بالمتقدمين لشغل الوظيفة لبدء المقارنة والتحليل الفوري.
                </p>
              </div>
            ) : (
              uploadedFiles.map((file, idx) => (
                <div
                  key={file.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between text-xs hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate text-xs">
                        {file.fileName}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(file.fileSize / 1024)} KB • تم الرفع {file.uploadedAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>جاهز للفحص</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                      title="إزالة هذا الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analysis In Progress Indicator */}
      {isAnalyzing && (
        <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              جاري فحص وفرز السير الذاتية ومقارنتها بالوصف الوظيفي...
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
              {analysisStep}
            </p>
          </div>
          <div className="max-w-md mx-auto h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Section 3: ATS Results & Top 10 Candidates */}
      {analysisResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* Executive Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                إجمالي السير المفحوصة
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {analysisResult.total_analyzed}
                </span>
                <span className="text-xs text-slate-400 font-bold">سيرة ذاتية</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                المرشحون المختارون
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {analysisResult.top_candidates.length}
                </span>
                <span className="text-xs text-slate-400 font-bold">أفضل مرشحين</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                أعلى نسبة تطابق (Top Match)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {analysisResult.top_candidates[0]?.match_percentage || 0}%
                </span>
                <span className="text-[11px] text-emerald-600 font-bold font-mono">
                  {analysisResult.top_candidates[0]?.full_name}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                محرك التقييم
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">
                  {analysisEngine}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                تم الفحص: {analysisResult.analyzed_at}
              </span>
            </div>
          </div>

          {/* Results Toolbar: Filter & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="بحث باسم المرشح أو المهارات..."
                  className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                />
              </div>

              {/* Score Filter */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setScoreFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                    scoreFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  الكل ({analysisResult.top_candidates.length})
                </button>
                <button
                  onClick={() => setScoreFilter('high')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                    scoreFilter === 'high'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ممتاز (+85%)
                </button>
                <button
                  onClick={() => setScoreFilter('medium')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                    scoreFilter === 'medium'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  جيد جداً (70-84%)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyStandardJson}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="نسخ صيغة مخرجات JSON المعتمدة للمرشحين"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'تم نسخ JSON!' : 'نسخ مخرجات JSON'}</span>
              </button>

              <button
                onClick={() => setShowJsonModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>معاينة كود JSON</span>
              </button>
            </div>
          </div>

          {/* Top Candidates Cards List */}
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => {
              const isTop3 = candidate.rank <= 3;
              const rankColor = 
                candidate.rank === 1 ? 'from-amber-500 to-yellow-600 text-white shadow-amber-500/20' :
                candidate.rank === 2 ? 'from-slate-400 to-slate-600 text-white' :
                candidate.rank === 3 ? 'from-amber-700 to-amber-900 text-white' :
                'from-blue-600 to-indigo-600 text-white';

              const scoreBadgeColor =
                candidate.match_percentage >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                candidate.match_percentage >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' :
                'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';

              return (
                <div
                  key={candidate.candidate_id + candidate.rank}
                  className={`p-6 rounded-3xl bg-white dark:bg-slate-800 border transition-all hover:shadow-md ${
                    isTop3 
                      ? 'border-blue-200 dark:border-blue-900/60 shadow-xs' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Candidate Identity & Rank */}
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankColor} flex flex-col items-center justify-center font-black shadow-md shrink-0`}>
                        <span className="text-[10px] uppercase font-bold opacity-80">Rank</span>
                        <span className="text-lg leading-none">#{candidate.rank}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {candidate.full_name}
                          </h3>
                          {candidate.rank === 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-600" />
                              المرشح الأفضل #1
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-mono text-[11px] text-slate-400">
                            ID: {candidate.candidate_id}
                          </span>

                          {candidate.email && candidate.email !== 'غير متوفر في المستند' && (
                            <a
                              href={`mailto:${candidate.email}`}
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{candidate.email}</span>
                            </a>
                          )}

                          {candidate.phone && candidate.phone !== 'غير متوفر في المستند' && (
                            <a
                              href={`tel:${candidate.phone}`}
                              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:underline font-mono"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{candidate.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Score & Actions */}
                    <div className="flex items-center gap-4 self-end lg:self-start">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          نسبة التوافق (Match Score)
                        </span>
                        <div className={`px-3 py-1 rounded-xl border text-sm font-black flex items-center gap-1 ${scoreBadgeColor}`}>
                          <Percent className="w-3.5 h-3.5" />
                          <span className="font-mono text-base">{candidate.match_percentage}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickOnboard(candidate)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                          title="إضافة المرشح كـ موظف جديد في سجلات الشركة"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>تعيين كموظف</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses / Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/80 text-xs">
                    {/* Key Strengths */}
                    <div className="space-y-2">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>نقاط القوة والمطابقة (Key Strengths):</span>
                      </span>
                      <ul className="space-y-1">
                        {candidate.key_strengths.map((strength, sIdx) => (
                          <li
                            key={sIdx}
                            className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed flex items-start gap-1.5"
                          >
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps or Weaknesses */}
                    <div className="space-y-2">
                      <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>الفجوات أو المهارات المفقودة (Gaps & Weaknesses):</span>
                      </span>
                      <ul className="space-y-1">
                        {candidate.gaps_or_weaknesses.map((gap, gIdx) => (
                          <li
                            key={gIdx}
                            className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed flex items-start gap-1.5"
                          >
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Recruiter Executive Summary */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs block mb-0.5">
                        ملخص مسؤول التوظيف (Executive Recruiter Summary):
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        "{candidate.ai_summary}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {showJsonModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  صيغة المخرجات المعتمدة (ATS JSON Format)
                </h3>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed" dir="ltr">
                {JSON.stringify({
                  total_analyzed: analysisResult.total_analyzed,
                  top_candidates: analysisResult.top_candidates
                }, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCopyStandardJson}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedJson ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedJson ? 'تم النسخ!' : 'نسخ كود JSON بالكامل'}</span>
              </button>
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
