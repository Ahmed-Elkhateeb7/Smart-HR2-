import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  Award,
  Star,
  CheckCircle2,
  XCircle,
  Clock3,
  BookOpen,
  MapPin,
  Globe,
  Building,
  Building2,
  UserCheck,
  FileCheck,
  Download,
  Printer,
  Trash2,
  Edit3,
  Eye,
  AlertCircle,
  Sparkles,
  TrendingUp,
  UserPlus,
  Send,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  TrainingCourse,
  TrainingNomination,
  TrainingType,
  CourseStatus,
  NominationStatus,
  AttendanceGrade,
  Employee,
  Department,
  CompanySettings
} from '../types';

interface TrainingViewProps {
  courses: TrainingCourse[];
  nominations: TrainingNomination[];
  employees: Employee[];
  departments: Department[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddCourse: (course: TrainingCourse) => void;
  onUpdateCourse: (course: TrainingCourse) => void;
  onDeleteCourse: (id: string) => void;
  onAddNomination: (nomination: TrainingNomination) => void;
  onUpdateNomination: (nomination: TrainingNomination) => void;
  onDeleteNomination: (id: string) => void;
  currencySymbol?: string;
  companySettings?: CompanySettings;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  courses,
  nominations,
  employees,
  departments,
  searchTerm,
  setSearchTerm,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddNomination,
  onUpdateNomination,
  onDeleteNomination,
  currencySymbol = 'ج.م',
  companySettings,
}) => {
  // Navigation tabs within Training view
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'nominations' | 'attendance_eval' | 'certificates'>('courses');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Modals state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<TrainingCourse | null>(null);

  const [showNominateModal, setShowNominateModal] = useState(false);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string>('');

  const [evaluatingNomination, setEvaluatingNomination] = useState<TrainingNomination | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<{ nomination: TrainingNomination; course?: TrainingCourse } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Course Form State
  const [courseForm, setCourseForm] = useState<{
    code: string;
    title: string;
    description: string;
    instructor: string;
    targetRole: string;
    department: string;
    type: TrainingType;
    status: CourseStatus;
    maxParticipants: number;
    startDate: string;
    endDate: string;
    durationHours: number;
    locationOrLink: string;
    costPerParticipant: number;
    objectives: string;
  }>({
    code: '',
    title: '',
    description: '',
    instructor: '',
    targetRole: '',
    department: 'كافة الأقسام',
    type: 'internal',
    status: 'upcoming',
    maxParticipants: 20,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    durationHours: 20,
    locationOrLink: 'قاعة التدريب الرئيسية',
    costPerParticipant: 0,
    objectives: '',
  });

  // Nomination Form State
  const [nominationForm, setNominationForm] = useState<{
    courseId: string;
    department: string;
    employeeId: string;
    nominatedBy: string;
    notes: string;
  }>({
    courseId: '',
    department: '',
    employeeId: '',
    nominatedBy: 'مدير القسم',
    notes: '',
  });

  // Evaluation Form State
  const [evalForm, setEvalForm] = useState<{
    attendanceRate: number;
    attendanceStatus: AttendanceGrade;
    employeeScore: number;
    instructorRating: number;
    courseContentRating: number;
    evaluationNotes: string;
    passed: boolean;
    issueCertificate: boolean;
  }>({
    attendanceRate: 100,
    attendanceStatus: 'completed',
    employeeScore: 5,
    instructorRating: 5,
    courseContentRating: 5,
    evaluationNotes: '',
    passed: true,
    issueCertificate: true,
  });

  // Rejection Modal State
  const [rejectionModal, setRejectionModal] = useState<{ open: boolean; nominationId: string; reason: string }>({
    open: false,
    nominationId: '',
    reason: '',
  });

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const ongoingCourses = courses.filter((c) => c.status === 'ongoing').length;
    const upcomingCourses = courses.filter((c) => c.status === 'upcoming').length;
    const completedCourses = courses.filter((c) => c.status === 'completed').length;

    const totalNominations = nominations.length;
    const approvedNominations = nominations.filter((n) => n.status === 'approved').length;
    const pendingNominations = nominations.filter((n) => n.status === 'pending').length;

    // Evaluated nominations
    const evaluated = nominations.filter((n) => n.employeeScore !== undefined && n.employeeScore > 0);
    const avgScore =
      evaluated.length > 0
        ? (evaluated.reduce((acc, curr) => acc + (curr.employeeScore || 0), 0) / evaluated.length).toFixed(1)
        : '5.0';

    const certificatesCount = nominations.filter((n) => n.certificateIssued).length;

    return {
      totalCourses,
      ongoingCourses,
      upcomingCourses,
      completedCourses,
      totalNominations,
      approvedNominations,
      pendingNominations,
      avgScore,
      certificatesCount,
    };
  }, [courses, nominations]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.department && c.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      const matchDept = departmentFilter === 'all' || c.department === departmentFilter || c.department === 'كافة الأقسام';

      return matchSearch && matchStatus && matchType && matchDept;
    });
  }, [courses, searchTerm, statusFilter, typeFilter, departmentFilter]);

  // Filtered nominations
  const filteredNominations = useMemo(() => {
    return nominations.filter((n) => {
      const matchSearch =
        n.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.employeeCode && n.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        n.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchDept = departmentFilter === 'all' || n.department === departmentFilter;

      return matchSearch && matchStatus && matchDept;
    });
  }, [nominations, searchTerm, statusFilter, departmentFilter]);

  // Open Add Course Modal
  const handleOpenAddCourse = () => {
    const nextNum = courses.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setEditingCourse(null);
    setCourseForm({
      code: `TRN-2026-${padded}`,
      title: '',
      description: '',
      instructor: '',
      targetRole: '',
      department: 'كافة الأقسام',
      type: 'internal',
      status: 'upcoming',
      maxParticipants: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationHours: 20,
      locationOrLink: 'قاعة التدريب الرئيسية',
      costPerParticipant: 0,
      objectives: '',
    });
    setShowAddCourseModal(true);
  };

  // Open Edit Course Modal
  const handleOpenEditCourse = (course: TrainingCourse) => {
    setEditingCourse(course);
    setCourseForm({
      code: course.code,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      targetRole: course.targetRole,
      department: course.department || 'كافة الأقسام',
      type: course.type,
      status: course.status,
      maxParticipants: course.maxParticipants,
      startDate: course.startDate,
      endDate: course.endDate,
      durationHours: course.durationHours,
      locationOrLink: course.locationOrLink || '',
      costPerParticipant: course.costPerParticipant || 0,
      objectives: course.objectives ? course.objectives.join('\n') : '',
    });
    setShowAddCourseModal(true);
  };

  // Submit Course Form
  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim() || !courseForm.instructor.trim()) {
      showToast('يرجى كتابة اسم الدورة واسم المدرب');
      return;
    }

    const objectivesList = courseForm.objectives
      .split('\n')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (editingCourse) {
      const updated: TrainingCourse = {
        ...editingCourse,
        code: courseForm.code,
        title: courseForm.title,
        description: courseForm.description,
        instructor: courseForm.instructor,
        targetRole: courseForm.targetRole,
        department: courseForm.department,
        type: courseForm.type,
        status: courseForm.status,
        maxParticipants: Number(courseForm.maxParticipants) || 1,
        startDate: courseForm.startDate,
        endDate: courseForm.endDate,
        durationHours: Number(courseForm.durationHours) || 1,
        locationOrLink: courseForm.locationOrLink,
        costPerParticipant: Number(courseForm.costPerParticipant) || 0,
        objectives: objectivesList,
      };
      onUpdateCourse(updated);
      showToast(`تم تحديث بيانات الدورة "${updated.title}" بنجاح`);
    } else {
      const newCourse: TrainingCourse = {
        id: `trn-c-${Date.now()}`,
        code: courseForm.code || `TRN-${Date.now().toString().slice(-4)}`,
        title: courseForm.title,
        description: courseForm.description,
        instructor: courseForm.instructor,
        targetRole: courseForm.targetRole || 'كافة الموظفين',
        department: courseForm.department,
        type: courseForm.type,
        status: courseForm.status,
        maxParticipants: Number(courseForm.maxParticipants) || 20,
        startDate: courseForm.startDate,
        endDate: courseForm.endDate,
        durationHours: Number(courseForm.durationHours) || 20,
        locationOrLink: courseForm.locationOrLink,
        costPerParticipant: Number(courseForm.costPerParticipant) || 0,
        objectives: objectivesList,
        createdDate: new Date().toISOString().split('T')[0],
      };
      onAddCourse(newCourse);
      showToast(`تمت إضافة الدورة التدريبية "${newCourse.title}" بنجاح`);
    }

    setShowAddCourseModal(false);
  };

  // Open Nominate Employee Modal
  const handleOpenNominate = (courseId?: string) => {
    const targetCourseId = courseId || (courses.length > 0 ? courses[0].id : '');
    setPreselectedCourseId(targetCourseId);
    setNominationForm({
      courseId: targetCourseId,
      department: departments.length > 0 ? departments[0].name : '',
      employeeId: '',
      nominatedBy: 'مدير القسم / الموارد البشرية',
      notes: '',
    });
    setShowNominateModal(true);
  };

  // Available employees for nomination based on selected department
  const filteredEmployeesForNomination = useMemo(() => {
    if (!nominationForm.department) return employees;
    return employees.filter((e) => e.department === nominationForm.department);
  }, [employees, nominationForm.department]);

  // Submit Nomination
  const handleSubmitNomination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominationForm.courseId || !nominationForm.employeeId) {
      showToast('يرجى اختيار الدورة والموظف المرشح');
      return;
    }

    const targetCourse = courses.find((c) => c.id === nominationForm.courseId);
    const targetEmp = employees.find((e) => e.id === nominationForm.employeeId);

    if (!targetCourse || !targetEmp) {
      showToast('خطأ في بيانات الدورة أو الموظف');
      return;
    }

    // Check if already nominated
    const existing = nominations.find(
      (n) => n.courseId === targetCourse.id && n.employeeId === targetEmp.id
    );
    if (existing) {
      showToast(`الموظف (${targetEmp.name}) تم ترشيحه مسبقاً لهذه الدورة`);
      return;
    }

    const newNomination: TrainingNomination = {
      id: `trn-nom-${Date.now()}`,
      courseId: targetCourse.id,
      courseTitle: targetCourse.title,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      employeeCode: targetEmp.employeeCode,
      department: targetEmp.department,
      position: targetEmp.position,
      nominatedBy: nominationForm.nominatedBy || 'الموارد البشرية',
      nominationDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      attendanceRate: 0,
      attendanceStatus: 'present',
      certificateIssued: false,
    };

    onAddNomination(newNomination);
    setShowNominateModal(false);
    showToast(`تم إرسال طلب ترشيح الموظف (${targetEmp.name}) للدورة بنجاح`);
  };

  // Quick Approval for Nomination
  const handleApproveNomination = (nom: TrainingNomination) => {
    const course = courses.find((c) => c.id === nom.courseId);
    const approvedCount = nominations.filter(
      (n) => n.courseId === nom.courseId && n.status === 'approved'
    ).length;

    if (course && approvedCount >= course.maxParticipants) {
      showToast(`تم بلوغ الحد الأقصى للمشاركين في هذه الدورة (${course.maxParticipants} مشارك)`);
    }

    const updated: TrainingNomination = {
      ...nom,
      status: 'approved',
      rejectionReason: undefined,
    };
    onUpdateNomination(updated);
    showToast(`تم قبول واعتماد ترشيح (${nom.employeeName}) للدورة`);
  };

  // Reject Nomination
  const handleConfirmReject = () => {
    const target = nominations.find((n) => n.id === rejectionModal.nominationId);
    if (!target) return;

    const updated: TrainingNomination = {
      ...target,
      status: 'rejected',
      rejectionReason: rejectionModal.reason || 'اعتذار لعدم توافق الشروط أو اكتمال المقاعد',
    };
    onUpdateNomination(updated);
    setRejectionModal({ open: false, nominationId: '', reason: '' });
    showToast(`تم رفض ترشيح (${target.employeeName})`);
  };

  // Open Evaluation Modal
  const handleOpenEvaluation = (nom: TrainingNomination) => {
    setEvaluatingNomination(nom);
    setEvalForm({
      attendanceRate: nom.attendanceRate || 100,
      attendanceStatus: nom.attendanceStatus || 'completed',
      employeeScore: nom.employeeScore || 5,
      instructorRating: nom.instructorRating || 5,
      courseContentRating: nom.courseContentRating || 5,
      evaluationNotes: nom.evaluationNotes || '',
      passed: nom.passed !== undefined ? nom.passed : true,
      issueCertificate: nom.certificateIssued || true,
    });
  };

  // Submit Evaluation
  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingNomination) return;

    const updated: TrainingNomination = {
      ...evaluatingNomination,
      attendanceRate: Number(evalForm.attendanceRate),
      attendanceStatus: evalForm.attendanceStatus,
      completedDate: new Date().toISOString().split('T')[0],
      employeeScore: evalForm.employeeScore,
      instructorRating: evalForm.instructorRating,
      courseContentRating: evalForm.courseContentRating,
      evaluationNotes: evalForm.evaluationNotes,
      passed: evalForm.passed,
      certificateIssued: evalForm.passed && evalForm.issueCertificate,
    };

    onUpdateNomination(updated);
    setEvaluatingNomination(null);
    showToast(`تم حفظ تقييم الموظف (${updated.employeeName}) بنجاح!`);
  };

  // Open Certificate View
  const handleViewCertificate = (nom: TrainingNomination) => {
    const course = courses.find((c) => c.id === nom.courseId);
    setViewingCertificate({ nomination: nom, course });
  };

  // Export Training Report to Excel
  const handleExportTrainingExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'نظام إدارة الموارد البشرية والتدريب';
      workbook.created = new Date();

      // Sheet 1: الدورات التدريبية
      const coursesSheet = workbook.addWorksheet('الدورات التدريبية', {
        views: [{ rightToLeft: true }],
      });

      coursesSheet.columns = [
        { header: 'كود الدورة', key: 'code', width: 16 },
        { header: 'اسم الدورة', key: 'title', width: 35 },
        { header: 'المدرب / الجهة', key: 'instructor', width: 28 },
        { header: 'القسم المستهدف', key: 'department', width: 22 },
        { header: 'المسمى المستهدف', key: 'targetRole', width: 28 },
        { header: 'النوع', key: 'type', width: 16 },
        { header: 'الحالة', key: 'status', width: 16 },
        { header: 'تاريخ البدء', key: 'startDate', width: 16 },
        { header: 'تاريخ الانتهاء', key: 'endDate', width: 16 },
        { header: 'ساعات التدريب', key: 'durationHours', width: 16 },
        { header: 'الحد الأقصى', key: 'maxParticipants', width: 14 },
        { header: 'المقبولين', key: 'enrolled', width: 14 },
      ];

      // Style Header
      const headerRow1 = coursesSheet.getRow(1);
      headerRow1.height = 28;
      headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow1.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      };
      headerRow1.alignment = { vertical: 'middle', horizontal: 'center' };

      courses.forEach((c) => {
        const enrolled = nominations.filter((n) => n.courseId === c.id && n.status === 'approved').length;
        const typeLabel = c.type === 'internal' ? 'داخلي' : c.type === 'external' ? 'خارجي' : 'أونلاين';
        const statusLabel =
          c.status === 'upcoming' ? 'قادمة' : c.status === 'ongoing' ? 'جارية' : c.status === 'completed' ? 'مكتملة' : 'ملغاة';

        const row = coursesSheet.addRow({
          code: c.code,
          title: c.title,
          instructor: c.instructor,
          department: c.department || 'كافة الأقسام',
          targetRole: c.targetRole,
          type: typeLabel,
          status: statusLabel,
          startDate: c.startDate,
          endDate: c.endDate,
          durationHours: c.durationHours,
          maxParticipants: c.maxParticipants,
          enrolled: enrolled,
        });
        row.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      // Sheet 2: ترشيحات وتقييمات الموظفين
      const nomSheet = workbook.addWorksheet('سجل الترشيحات والتقييمات', {
        views: [{ rightToLeft: true }],
      });

      nomSheet.columns = [
        { header: 'كود الموظف', key: 'empCode', width: 15 },
        { header: 'اسم الموظف', key: 'empName', width: 28 },
        { header: 'القسم', key: 'dept', width: 22 },
        { header: 'الوظيفة', key: 'position', width: 24 },
        { header: 'الدورة التدريبية', key: 'course', width: 35 },
        { header: 'حالة الترشيح', key: 'status', width: 16 },
        { header: 'نسبة الحضور', key: 'attendance', width: 16 },
        { header: 'تقييم الاستفادة (من 5)', key: 'score', width: 20 },
        { header: 'تقييم المدرب', key: 'instRating', width: 16 },
        { header: 'النتيجة', key: 'passed', width: 16 },
        { header: 'الشهادة', key: 'cert', width: 16 },
        { header: 'ملاحظات التقييم', key: 'notes', width: 35 },
      ];

      const headerRow2 = nomSheet.getRow(1);
      headerRow2.height = 28;
      headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' },
      };
      headerRow2.alignment = { vertical: 'middle', horizontal: 'center' };

      nominations.forEach((n) => {
        const statusLabel =
          n.status === 'approved' ? 'موافق عليه' : n.status === 'pending' ? 'قيد الانتظار' : 'مرفوض';
        const passedLabel = n.passed === undefined ? 'قيد التدريب' : n.passed ? 'اجتاز بنجاح' : 'لم يجتز';
        const certLabel = n.certificateIssued ? 'صادرة وموثقة' : 'غير صادرة';

        const row = nomSheet.addRow({
          empCode: n.employeeCode || '-',
          empName: n.employeeName,
          dept: n.department,
          position: n.position,
          course: n.courseTitle,
          status: statusLabel,
          attendance: `${n.attendanceRate || 0}%`,
          score: n.employeeScore ? `${n.employeeScore} / 5` : '-',
          instRating: n.instructorRating ? `${n.instructorRating} / 5` : '-',
          passed: passedLabel,
          cert: certLabel,
          notes: n.evaluationNotes || '',
        });
        row.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_إدارة_التدريب_والتطوير_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('تم تصدير تقرير التدريب إلى ملف Excel بنجاح');
    } catch (err) {
      console.error('Error exporting training report:', err);
      showToast('حدث خطأ أثناء تصدير التقرير');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-sm font-bold shadow-2xl backdrop-blur-md flex items-center gap-3 border border-slate-700/50 dark:border-slate-200 transition-all duration-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
              <GraduationCap className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                إدارة التدريب والتطوير المهني
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                تخطيط الدورات التدريبية، ترشيح وتأهيل الكوادر، متابعة الحضور والتقييمات وإصدار الشهادات المعتمدة.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full lg:w-auto">
          <button
            onClick={handleOpenAddCourse}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة دورة جديدة</span>
          </button>

          <button
            onClick={() => handleOpenNominate()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>ترشيح موظف لدورة</span>
          </button>

          <button
            onClick={handleExportTrainingExcel}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-md border border-white/15 transition-all cursor-pointer"
            title="تصدير تقرير التدريب إلى Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الدورات</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalCourses}</span>
            <span className="text-[11px] text-slate-400 mr-1.5">برنامج تدريبي</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">الدورات الجارية</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.ongoingCourses}</span>
            <span className="text-[11px] text-slate-400 mr-1.5">قيد التنفيذ حالياً</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">المتدربون المعتمدون</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approvedNominations}</span>
            <span className="text-[11px] text-slate-400 mr-1.5">متدرب مسجل</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ترشيحات بالانتظار</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.pendingNominations}</span>
            <span className="text-[11px] text-slate-400 mr-1.5">طلب ترشيح</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">متوسط تقييم التدريب</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgScore}</span>
            <span className="text-xs font-bold text-amber-500">/ 5.0 ⭐</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Bar & Filters Section */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Sub Navigation Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab('courses')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'courses'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>إدارة الدورات ({courses.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('nominations')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'nominations'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>الترشيحات والتسجيل ({nominations.length})</span>
              {stats.pendingNominations > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                  {stats.pendingNominations}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('attendance_eval')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'attendance_eval'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>الحضور والتقييمات</span>
            </button>

            <button
              onClick={() => setActiveSubTab('certificates')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'certificates'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>الشهادات المعتمدة ({stats.certificatesCount})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، الكود، المدرب، أو القسم..."
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>فلترة العرض:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">كافة الحالات</option>
            {activeSubTab === 'courses' ? (
              <>
                <option value="upcoming">قادمة (Upcoming)</option>
                <option value="ongoing">جارية (Ongoing)</option>
                <option value="completed">مكتملة (Completed)</option>
                <option value="cancelled">ملغاة (Cancelled)</option>
              </>
            ) : (
              <>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
              </>
            )}
          </select>

          {/* Type Filter (for courses) */}
          {activeSubTab === 'courses' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">كافة الأنواع</option>
              <option value="internal">تدريب داخلي</option>
              <option value="external">تدريب خارجي</option>
              <option value="online">أونلاين (عن بعد)</option>
            </select>
          )}

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">كافة الأقسام المستهدفة</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || typeFilter !== 'all' || departmentFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setDepartmentFilter('all');
                setSearchTerm('');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 transition-all text-xs cursor-pointer mr-auto"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: Courses Management (إدارة الدورات التدريبية) */}
      {/* ======================================================== */}
      {activeSubTab === 'courses' && (
        <div className="space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/70 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-500 mx-auto flex items-center justify-center">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                لا توجد دورات تدريبية مطابقة لمعايير البحث
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                يمكنك إضافة دورات تدريبية جديدة لتأهيل منسوبي الشركة أو تعديل معايير البحث والفلترة.
              </p>
              <button
                onClick={handleOpenAddCourse}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دورة جديدة الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => {
                const enrolledCount = nominations.filter(
                  (n) => n.courseId === course.id && n.status === 'approved'
                ).length;
                const pendingCount = nominations.filter(
                  (n) => n.courseId === course.id && n.status === 'pending'
                ).length;
                const capacityPercent = Math.min(
                  100,
                  Math.round((enrolledCount / (course.maxParticipants || 1)) * 100)
                );

                // Type badge styling
                const typeBg =
                  course.type === 'internal'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : course.type === 'online'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
                const typeText =
                  course.type === 'internal' ? 'داخلي بالشركة' : course.type === 'online' ? 'أونلاين (عن بعد)' : 'خارجي';

                // Status badge styling
                const statusBg =
                  course.status === 'ongoing'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : course.status === 'upcoming'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : course.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
                const statusText =
                  course.status === 'ongoing'
                    ? 'جارية الآن'
                    : course.status === 'upcoming'
                    ? 'قادمة'
                    : course.status === 'completed'
                    ? 'مكتملة'
                    : 'ملغاة';

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Card Header Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
                          {course.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeBg}`}>
                            {typeText}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBg}`}>
                            {statusText}
                          </span>
                        </div>
                      </div>

                      {/* Course Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {course.description || 'برنامج تدريبي لتطوير المهارات الوظيفية.'}
                        </p>
                      </div>

                      {/* Info Metadata */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate font-semibold">{course.instructor}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            المستهدف: <strong>{course.targetRole}</strong> ({course.department || 'كافة الأقسام'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            {course.startDate} ⬅ {course.endDate} ({course.durationHours} ساعة)
                          </span>
                        </div>

                        {course.locationOrLink && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {course.type === 'online' ? (
                              <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate">{course.locationOrLink}</span>
                          </div>
                        )}
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          <span>
                            المقاعد المحجوزة: <strong>{enrolledCount}</strong> من {course.maxParticipants}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">{capacityPercent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              capacityPercent >= 100
                                ? 'bg-rose-500'
                                : capacityPercent >= 75
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                        {pendingCount > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1">
                            يوجد {pendingCount} طلب ترشيح بانتظار الموافقة
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedCourseDetails(course)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="عرض تفاصيل الدورة والأهداف"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>التفاصيل</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenNominate(course.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="ترشيح موظف لهذه الدورة"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>ترشيح</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditCourse(course)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="تعديل الدورة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رغبتك في حذف الدورة (${course.title})؟`)) {
                              onDeleteCourse(course.id);
                              showToast(`تم حذف الدورة (${course.title})`);
                            }
                          }}
                          className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                          title="حذف الدورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: Nominations & Enrollment (الترشيحات والتسجيل) */}
      {/* ======================================================== */}
      {activeSubTab === 'nominations' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>سجل ترشيحات وتسجيل الموظفين بالدورات التدريبية</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تتبع حالة طلبات الترشيح المقدمة من مدراء الأقسام واعتمادها أو الاعتذار عنها.
              </p>
            </div>

            <button
              onClick={() => handleOpenNominate()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ ترشيح موظف جديد</span>
            </button>
          </div>

          {filteredNominations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد طلبات ترشيح مسجلة
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ابدأ بترشيح الموظفين للدورات التدريبية القادمة والجارية.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="py-3.5 px-4">الموظف المرشح</th>
                    <th className="py-3.5 px-4">القسم والوظيفة</th>
                    <th className="py-3.5 px-4">الدورة التدريبية</th>
                    <th className="py-3.5 px-4">تاريخ وجهة الترشيح</th>
                    <th className="py-3.5 px-4">حالة الطلب</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات والاعتماد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredNominations.map((nom) => {
                    const statusBadge =
                      nom.status === 'approved' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>موافق عليه</span>
                        </span>
                      ) : nom.status === 'pending' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>قيد الانتظار</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>مرفوض</span>
                        </span>
                      );

                    return (
                      <tr
                        key={nom.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        {/* Employee Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {nom.employeeName}
                          </div>
                          {nom.employeeCode && (
                            <span className="text-[11px] font-mono text-slate-400">
                              كود: {nom.employeeCode}
                            </span>
                          )}
                        </td>

                        {/* Dept & Position */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {nom.department}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {nom.position}
                          </div>
                        </td>

                        {/* Course Title */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-blue-600 dark:text-blue-400 truncate">
                            {nom.courseTitle}
                          </div>
                        </td>

                        {/* Date & Nominated By */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {nom.nominatedBy}
                          </div>
                          <div className="text-[11px] text-slate-400">{nom.nominationDate}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {statusBadge}
                          {nom.rejectionReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-xs truncate">
                              سبب الرفض: {nom.rejectionReason}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {nom.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveNomination(nom)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                  title="موافقة واعتماد الترشيح"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>موافقة</span>
                                </button>

                                <button
                                  onClick={() =>
                                    setRejectionModal({
                                      open: true,
                                      nominationId: nom.id,
                                      reason: '',
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                  title="رفض الترشيح"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>رفض</span>
                                </button>
                              </>
                            )}

                            {nom.status === 'approved' && (
                              <button
                                onClick={() => handleOpenEvaluation(nom)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                title="تسجيل الحضور والتقييم"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                <span>تقييم وحضور</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (window.confirm(`هل تريد حذف سجل ترشيح (${nom.employeeName})؟`)) {
                                  onDeleteNomination(nom.id);
                                  showToast(`تم حذف ترشيح (${nom.employeeName})`);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                              title="حذف الترشيح"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: Attendance & Evaluation (الحضور والتقييمات) */}
      {/* ======================================================== */}
      {activeSubTab === 'attendance_eval' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>متابعة حضور وتقييم المتدربين بعد انتهاء الدورة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                رصد نسبة الحضور الفعلي، قياس مدى استفادة الموظف، تقييم المدرب، واعتماد اجتياز الدورة.
              </p>
            </div>
          </div>

          {nominations.filter((n) => n.status === 'approved').length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا يوجد متدربون معتمدون حالياً
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                قم باعتماد ترشيحات الموظفين أولاً لتتمكن من رصد الحضور وتسجيل التقييمات.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="py-3.5 px-4">المتدرب</th>
                    <th className="py-3.5 px-4">الدورة التدريبية</th>
                    <th className="py-3.5 px-4">نسبة الحضور</th>
                    <th className="py-3.5 px-4">تقييم الاستفادة</th>
                    <th className="py-3.5 px-4">تقييم المدرب</th>
                    <th className="py-3.5 px-4">النتيجة والشهادة</th>
                    <th className="py-3.5 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {nominations
                    .filter((n) => n.status === 'approved')
                    .map((nom) => {
                      const hasEvaluated = nom.employeeScore !== undefined;

                      return (
                        <tr
                          key={nom.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {nom.employeeName}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {nom.department} • {nom.position}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-blue-600 dark:text-blue-400 max-w-xs truncate">
                            {nom.courseTitle}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {nom.attendanceRate || 0}%
                              </span>
                              <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${nom.attendanceRate || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {nom.employeeScore ? (
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <span>{nom.employeeScore}</span>
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">لم يقيّم بعد</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {nom.instructorRating ? (
                              <div className="flex items-center gap-1 text-blue-500 font-bold">
                                <span>{nom.instructorRating}</span>
                                <Star className="w-3.5 h-3.5 fill-blue-400" />
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {hasEvaluated ? (
                              <div className="flex items-center gap-2">
                                {nom.passed ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                                    اجتاز بنجاح ✅
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-extrabold">
                                    لم يجتز ❌
                                  </span>
                                )}
                                {nom.certificateIssued && (
                                  <button
                                    onClick={() => handleViewCertificate(nom)}
                                    className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] font-bold inline-flex items-center gap-1"
                                  >
                                    <Award className="w-3 h-3" />
                                    <span>الشهادة</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">بانتظار رصد النتيجة</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenEvaluation(nom)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{hasEvaluated ? 'تعديل التقييم' : 'رصد التقييم'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: Certificates (الشهادات المعتمدة) */}
      {/* ======================================================== */}
      {activeSubTab === 'certificates' && (
        <div className="space-y-4">
          {nominations.filter((n) => n.certificateIssued).length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/70 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                لم يتم إصدار شهادات تدريبية معتمدة حتى الآن
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                عند إتمام الموظفين للدورات التدريبية واجتياز التقييم بنجاح، يمكنك إصدار وطباعة شهادات رسمية معتمدة لهم هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nominations
                .filter((n) => n.certificateIssued)
                .map((nom) => {
                  const course = courses.find((c) => c.id === nom.courseId);

                  return (
                    <div
                      key={nom.id}
                      className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-50 dark:via-slate-800/90 to-white dark:to-slate-900 border-2 border-amber-400/40 dark:border-amber-500/30 shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Award className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                            شهادة إتمام معتمدة
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {nom.employeeName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {nom.department} • {nom.position}
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 truncate">
                            {nom.courseTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>المدرب: {course?.instructor || 'المدرب المعتمد'}</span>
                            <span>{course?.durationHours || 20} ساعة</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold pt-1">
                          <span>التقييم: ⭐ {nom.employeeScore || 5} / 5</span>
                          <span>تاريخ الإكمال: {nom.completedDate || nom.nominationDate}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewCertificate(nom)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>معاينة وطباعة الشهادة الرسمية</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: Add / Edit Training Course */}
      {/* ======================================================== */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingCourse ? 'تعديل بيانات الدورة التدريبية' : 'إضافة دورة تدريبية جديدة'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    أدخل تفاصيل الدورة، المدرب، الفئة المستهدفة، والجدول الزمني.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddCourseModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCourse} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود الدورة *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="TRN-2026-01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الدورة التدريبية *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="مثال: إدارة وتطوير الموارد البشرية الاحترافية"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وصف الدورة والمحتوى
                </label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="نبذة عن محاور البرنامج التدريبي والمهارات المكتسبة..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المدرب أو الجهة المقدمة *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseForm.instructor}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="مثال: د. طارق السعيد - معهد الإدارة"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوصف / المسمى الوظيفي المستهدف
                  </label>
                  <input
                    type="text"
                    value={courseForm.targetRole}
                    onChange={(e) => setCourseForm({ ...courseForm, targetRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="مثال: أخصائيو الموارد البشرية والمطورون"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    القسم المستهدف
                  </label>
                  <select
                    value={courseForm.department}
                    onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="كافة الأقسام">كافة الأقسام</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع التدريب *
                  </label>
                  <select
                    value={courseForm.type}
                    onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value as TrainingType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                  >
                    <option value="internal">داخلي (داخل الشركة)</option>
                    <option value="external">خارجي (معهد / مركز معتمد)</option>
                    <option value="online">أونلاين (عن بعد Zoom / Teams)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الدورة *
                  </label>
                  <select
                    value={courseForm.status}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as CourseStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                  >
                    <option value="upcoming">قادمة (Upcoming)</option>
                    <option value="ongoing">جارية (Ongoing)</option>
                    <option value="completed">مكتملة (Completed)</option>
                    <option value="cancelled">ملغاة (Cancelled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={courseForm.startDate}
                    onChange={(e) => setCourseForm({ ...courseForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    value={courseForm.endDate}
                    onChange={(e) => setCourseForm({ ...courseForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عدد الساعات التدريبية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={courseForm.durationHours}
                    onChange={(e) => setCourseForm({ ...courseForm, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحد الأقصى للمشاركين *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={courseForm.maxParticipants}
                    onChange={(e) => setCourseForm({ ...courseForm, maxParticipants: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مكان الانعقاد أو رابط المنصة الافتراضية
                  </label>
                  <input
                    type="text"
                    value={courseForm.locationOrLink}
                    onChange={(e) => setCourseForm({ ...courseForm, locationOrLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="مثال: قاعة التدريب رقم 2 أو رابط Zoom"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التكلفة لكل متدرب ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={courseForm.costPerParticipant}
                    onChange={(e) => setCourseForm({ ...courseForm, costPerParticipant: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الأهداف التدريبية والمخرجات (سطر لكل هدف)
                </label>
                <textarea
                  rows={2}
                  value={courseForm.objectives}
                  onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="الهدف 1: إتقان إدارة مؤشرات الأداء&#10;الهدف 2: صياغة الخطط الاستراتيجية"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {editingCourse ? 'حفظ التعديلات' : 'إضافة الدورة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Nominate Employee Modal */}
      {/* ======================================================== */}
      {showNominateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    ترشيح موظف لدورة تدريبية
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    اختر القسم والموظف المرشح والدورة المناسبة لاحتياجاته التطويرية.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNominateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNomination} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الدورة التدريبية المطلوبة *
                </label>
                <select
                  required
                  value={nominationForm.courseId}
                  onChange={(e) => setNominationForm({ ...nominationForm, courseId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- اختر الدورة التدريبية --</option>
                  {courses.map((c) => {
                    const enrolled = nominations.filter(
                      (n) => n.courseId === c.id && n.status === 'approved'
                    ).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title} (المقاعد: {enrolled}/{c.maxParticipants})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    القسم
                  </label>
                  <select
                    value={nominationForm.department}
                    onChange={(e) =>
                      setNominationForm({
                        ...nominationForm,
                        department: e.target.value,
                        employeeId: '',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">كافة الأقسام</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الموظف المرشح *
                  </label>
                  <select
                    required
                    value={nominationForm.employeeId}
                    onChange={(e) => setNominationForm({ ...nominationForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {filteredEmployeesForNomination.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الجهة / المسؤول الذي قام بالترشيح
                </label>
                <input
                  type="text"
                  value={nominationForm.nominatedBy}
                  onChange={(e) => setNominationForm({ ...nominationForm, nominatedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="مثال: مدير الموارد البشرية أو مدير القسم"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبررات الترشيح والأهداف التطويرية للموظف
                </label>
                <textarea
                  rows={2}
                  value={nominationForm.notes}
                  onChange={(e) => setNominationForm({ ...nominationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="تأهيل الموظف لمسؤوليات إشرافية جديدة وسد الفجوات المهارية..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setShowNominateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  إرسال طلب الترشيح
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Evaluation & Attendance Modal */}
      {/* ======================================================== */}
      {evaluatingNomination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    تسجيل الحضور والتقييم بعد انتهاء الدورة
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    للموظف: <strong>{evaluatingNomination.employeeName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEvaluatingNomination(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-1">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  {evaluatingNomination.courseTitle}
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300">
                  القسم: {evaluatingNomination.department} • الوظيفة: {evaluatingNomination.position}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نسبة حضور الجلسات التدريبية (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={evalForm.attendanceRate}
                    onChange={(e) => setEvalForm({ ...evalForm, attendanceRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الحضور
                  </label>
                  <select
                    value={evalForm.attendanceStatus}
                    onChange={(e) => setEvalForm({ ...evalForm, attendanceStatus: e.target.value as AttendanceGrade })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="completed">أكمل الدورة بنجاح</option>
                    <option value="present">حاضر (مستمر)</option>
                    <option value="absent">غائب / منقطع</option>
                  </select>
                </div>
              </div>

              {/* Star Ratings */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    درجة استفادة الموظف من التدريب (1 إلى 5 نجوم)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEvalForm({ ...evalForm, employeeScore: star })}
                        className={`p-1.5 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                          star <= evalForm.employeeScore ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= evalForm.employeeScore ? 'fill-amber-400' : ''
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 mr-2">
                      {evalForm.employeeScore} من 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    تقييم أداء المدرب
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEvalForm({ ...evalForm, instructorRating: star })}
                        className={`p-1.5 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                          star <= evalForm.instructorRating ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= evalForm.instructorRating ? 'fill-blue-400' : ''
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 mr-2">
                      {evalForm.instructorRating} من 5
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وتوصيات التقييم النهائي
                </label>
                <textarea
                  rows={2}
                  value={evalForm.evaluationNotes}
                  onChange={(e) => setEvalForm({ ...evalForm, evaluationNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="ملاحظات حول مستوى تفاعل الموظف والتطبيق العملي لمحتوى الدورة..."
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalForm.passed}
                    onChange={(e) =>
                      setEvalForm({
                        ...evalForm,
                        passed: e.target.checked,
                        issueCertificate: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      اجتياز الدورة التدريبية بنجاح
                    </span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      تأكيد أن الموظف حقق متطلبات الحضور والاستيعاب.
                    </p>
                  </div>
                </label>

                {evalForm.passed && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>إصدار شهادة</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setEvaluatingNomination(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  حفظ واعتماد التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Course Details Modal */}
      {/* ======================================================== */}
      {selectedCourseDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {selectedCourseDetails.code}
                </span>
              </div>
              <button
                onClick={() => setSelectedCourseDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedCourseDetails.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedCourseDetails.description}
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">المدرب:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedCourseDetails.instructor}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">الساعات:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedCourseDetails.durationHours} ساعة
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">الفترة:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedCourseDetails.startDate} إلى {selectedCourseDetails.endDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">المقر / الرابط:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedCourseDetails.locationOrLink || 'المقر الرئيسي'}
                    </strong>
                  </div>
                </div>
              </div>

              {selectedCourseDetails.objectives && selectedCourseDetails.objectives.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    الأهداف والمخرجات التعليمية:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-xs pr-1">
                    {selectedCourseDetails.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex justify-end gap-2">
              <button
                onClick={() => {
                  const cId = selectedCourseDetails.id;
                  setSelectedCourseDetails(null);
                  handleOpenNominate(cId);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>ترشيح موظف لهذه الدورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: Rejection Reason Modal */}
      {/* ======================================================== */}
      {rejectionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>رفض طلب الترشيح</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يرجى كتابة سبب الاعتذار أو الرفض ليظهر في سجلات التدريب للمدير المباشر.
            </p>

            <div>
              <textarea
                rows={3}
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="مثال: اكتمال المقاعد المتاحة للدورة / عدم تطابق التخصص..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal({ open: false, nominationId: '', reason: '' })}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: Official Training Certificate Modal (معاينة وطباعة) */}
      {/* ======================================================== */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none print:max-w-none print:w-full">
            {/* Top Toolbar (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                <Award className="w-5 h-5 text-amber-500" />
                <span>معاينة شهادة إتمام دورة تدريبية رسمية</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الشهادة الرسمية</span>
                </button>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Certificate Canvas Frame */}
            <div
              id="printable-certificate"
              className="p-8 sm:p-12 rounded-3xl border-8 border-double border-amber-600/30 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 text-center space-y-6 shadow-inner relative overflow-hidden"
            >
              {/* Certificate Top Header: Company Logo & Institution Branding */}
              <div className="space-y-2 pb-2">
                <div className="flex flex-col items-center justify-center">
                  {companySettings?.logoUrl ? (
                    <div className="mb-2 p-1.5 rounded-2xl bg-white/90 border border-amber-200/60 shadow-xs inline-flex items-center justify-center">
                      <img
                        src={companySettings.logoUrl}
                        alt={companySettings?.companyName || 'شعار المنشأة'}
                        referrerPolicy="no-referrer"
                        className="h-16 sm:h-20 w-auto object-contain max-w-[240px]"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-700 mx-auto flex items-center justify-center mb-2 border border-amber-300/80 shadow-xs">
                      <Building2 className="w-9 h-9 text-amber-600" />
                    </div>
                  )}

                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wide">
                    {companySettings?.companyName || 'شركة جديدة'}
                  </h3>
                </div>

                <h4 className="text-xs font-black tracking-widest text-amber-800 uppercase">
                  إدارة الموارد البشرية والتدريب والتطوير المؤسسي
                </h4>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  شهادة إتمام برنامج تدريبي معتمد
                </h2>
                <div className="w-36 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto rounded-full mt-2" />
              </div>

              <div className="space-y-4 max-w-xl mx-auto text-slate-700">
                <p className="text-sm font-medium">تشهد إدارة التطوير المؤسسي والتدريب بأن الموظف /</p>
                <h3 className="text-2xl font-extrabold text-blue-900 border-b-2 border-slate-300 pb-2 inline-block px-8">
                  {viewingCertificate.nomination.employeeName}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  (المسمى الوظيفي: {viewingCertificate.nomination.position} • قسم{' '}
                  {viewingCertificate.nomination.department})
                </p>

                <p className="text-sm leading-relaxed">
                  قد أتم بنجاح كافة متطلبات البرنامج التدريبي التخصصي بعنوان:
                </p>
                <div className="p-3.5 rounded-2xl bg-amber-100/60 border border-amber-300 font-extrabold text-slate-900 text-base sm:text-lg">
                  « {viewingCertificate.nomination.courseTitle} »
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 font-semibold pt-2">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">المدرب المعتمد</span>
                    <strong>{viewingCertificate.course?.instructor || 'المدرب المعتمد'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">ساعات التدريب</span>
                    <strong>{viewingCertificate.course?.durationHours || 24} ساعة تدريبية</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[10px]">تقييم الأداء</span>
                    <strong className="text-amber-700">
                      ممتاز ⭐ ({viewingCertificate.nomination.employeeScore || 5}/5)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 items-center gap-4 text-xs">
                <div className="text-center space-y-4">
                  <p className="font-bold text-slate-700">مدرب البرنامج التدريبي</p>
                  <div className="font-serif italic text-slate-600 text-sm font-semibold border-b border-dashed border-slate-300 pb-1 inline-block min-w-[120px]">
                    {viewingCertificate.course?.instructor?.split('-')[0] || 'المدرب المعتمد'}
                  </div>
                </div>

                {/* Central Accreditation Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500 bg-amber-50/80 flex flex-col items-center justify-center p-1 text-center shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <span className="text-[8px] font-black text-amber-800 leading-tight mt-0.5">
                      اعتماد رسمي
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="font-bold text-slate-700">مدير عام الموارد البشرية</p>
                  <div className="font-serif italic text-slate-600 text-sm font-semibold border-b border-dashed border-slate-300 pb-1 inline-block min-w-[120px]">
                    {companySettings?.companyName || 'الإدارة المعتمدة'}
                  </div>
                </div>
              </div>

              {/* Certificate Bottom: Granting Company Name (الشركة المانحة) */}
              <div className="pt-4 border-t-2 border-dashed border-amber-300/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-800 bg-amber-50/80 py-2.5 px-4 rounded-2xl border border-amber-200/90 shadow-2xs">
                  <span className="text-slate-600 font-semibold">الجهة المانحة والمعتمدة للشهادة:</span>
                  <span className="text-blue-950 font-black text-sm sm:text-base px-2 py-0.5 rounded-lg bg-amber-200/60 border border-amber-300">
                    {companySettings?.companyName || 'شركة جديدة'}
                  </span>
                  {companySettings?.commercialRecord && (
                    <span className="text-slate-600 text-[11px] font-semibold">
                      • السجل التجاري: <strong className="font-mono text-slate-800">{companySettings.commercialRecord}</strong>
                    </span>
                  )}
                  {companySettings?.taxNumber && (
                    <span className="text-slate-600 text-[11px] font-semibold">
                      • الرقم الضريبي: <strong className="font-mono text-slate-800">{companySettings.taxNumber}</strong>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono pt-1">
                  <div>
                    كود التوثيق والاعتماد: <span className="font-bold text-slate-700">CERT-{viewingCertificate.nomination.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div>
                    تاريخ الإصدار: <span className="font-bold text-slate-700">{viewingCertificate.nomination.completedDate || new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div>
                    الحالة: <span className="text-emerald-700 font-bold">موثقة ومعتمدة رسمياً ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
