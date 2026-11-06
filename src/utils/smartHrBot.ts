// Smart HR Interactive Conversational & Calculation Engine
// Provides instant (<10ms), comprehensive, legal and mathematical answers to any HR question

export interface HrContextData {
  employees?: any[];
  attendance?: any[];
  payroll?: any[];
  loans?: any[];
  assets?: any[];
  departments?: any[];
  currencySymbol?: string;
}

export function generateSmartInteractiveHrReply(
  rawMessage: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }> = [],
  hrContext: HrContextData = {}
): string {
  const msg = (rawMessage || '').trim();
  const q = msg.toLowerCase();
  const employees: any[] = Array.isArray(hrContext?.employees) ? hrContext.employees : [];
  const attendance: any[] = Array.isArray(hrContext?.attendance) ? hrContext.attendance : [];
  const payroll: any[] = Array.isArray(hrContext?.payroll) ? hrContext.payroll : [];
  const loans: any[] = Array.isArray(hrContext?.loans) ? hrContext.loans : [];
  const assets: any[] = Array.isArray(hrContext?.assets) ? hrContext.assets : [];
  const departments: any[] = Array.isArray(hrContext?.departments) ? hrContext.departments : [];
  const currency = hrContext?.currencySymbol || 'ج.م';

  // Normalize Arabic & English digits for numerical analysis
  const normalizedDigits = msg.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const numbersInMsg = (normalizedDigits.match(/\d+(\.\d+)?/g) || []).map(Number);

  // Check conversational history context
  const lastUserMsg = history.length >= 2 ? history[history.length - 2]?.text || '' : '';
  const lastBotMsg = history.length >= 1 ? history[history.length - 1]?.text || '' : '';
  const combinedContext = `${lastUserMsg} ${lastBotMsg} ${msg}`.toLowerCase();

  // -------------------------------------------------------------
  // 1. Live Employee Search (استعلام فوري عن موظف مسجل في النظام)
  // -------------------------------------------------------------
  if (employees.length > 0) {
    const matchedEmp = employees.find((emp) => {
      if (!emp?.name) return false;
      const fullName = emp.name.trim().toLowerCase();
      const code = String(emp.employeeCode || '').trim().toLowerCase();
      const phone = String(emp.phone || '').trim();
      const nationalId = String(emp.nationalId || emp.iqamaOrIdNumber || '').trim();

      // Exact match on Code or ID or Phone
      if (code && (q.includes(code) || q === code)) return true;
      if (phone && phone.length > 6 && q.includes(phone)) return true;
      if (nationalId && nationalId.length > 6 && q.includes(nationalId)) return true;

      // Exact match on Full Name
      if (q.includes(fullName)) return true;

      // Partial name matching
      const nameParts = fullName.split(/\s+/).filter((p: string) => p.length > 2);
      if (nameParts.length >= 2 && q.includes(nameParts[0]) && q.includes(nameParts[1])) return true;

      // Search with common keyword hints (راتب فلان، موظف فلان، سلفة فلان)
      const hasKeywords =
        q.includes('موظف') ||
        q.includes('راتب') ||
        q.includes('مرتب') ||
        q.includes('بيانات') ||
        q.includes('حضور') ||
        q.includes('سلف') ||
        q.includes('عهد') ||
        q.includes('قسم') ||
        q.includes('مين') ||
        q.includes('معلومات') ||
        q.includes('ملف') ||
        q.includes('تأخير') ||
        q.includes('تأمين');

      return nameParts.some((part: string) => part.length >= 3 && q.includes(part) && hasKeywords);
    });

    if (matchedEmp) {
      const baseSalary = Number(matchedEmp.baseSalary || 0);
      const housing = Number(matchedEmp.housingAllowance || 0);
      const transport = Number(matchedEmp.transportAllowance || 0);
      const other = Number(matchedEmp.otherAllowances || 0);
      const totalAllowances = housing + transport + other;
      const grossSalary = baseSalary + totalAllowances;
      const gosi = Number(matchedEmp.gosiInsurance || 0) || Math.round(baseSalary * 0.11);
      const netSalary = grossSalary - gosi;

      const empLoans = loans.filter((l) => l.employeeId === matchedEmp.id && l.status === 'نشط');
      const empAssets = assets.filter((a) => a.assignedToEmployeeId === matchedEmp.id);
      const empAtt = attendance.filter((a) => a.employeeId === matchedEmp.id);
      const lateAtt = empAtt.filter((a) => a.status === 'late' || (a.delayMinutes && a.delayMinutes > 0));
      const totalDelayMin = lateAtt.reduce((sum, a) => sum + (Number(a.delayMinutes) || 0), 0);

      return `👤 **ملف الموظف الكامل: ${matchedEmp.name}**
• **الكود الوظيفي:** ${matchedEmp.employeeCode || 'بدون كود'}
• **المسمى الوظيفي:** ${matchedEmp.position || 'غير محدد'} | **القسم:** ${matchedEmp.department || 'غير محدد'}
• **الحالة الوظيفية:** ${matchedEmp.status === 'active' ? 'نشط على رأس العمل ✅' : matchedEmp.status === 'on_leave' ? 'في إجازة 🌴' : matchedEmp.status}
• **تاريخ الالتحاق:** ${matchedEmp.joinDate || 'غير مسجل'} | **نوع العقد:** ${matchedEmp.contractType || 'دوام كامل'}
• **الهاتف:** ${matchedEmp.phone || 'غير مسجل'} | **البريد:** ${matchedEmp.email || 'غير مسجل'}
• **الرقم القومي / الهوية:** ${matchedEmp.nationalId || matchedEmp.iqamaOrIdNumber || 'غير مسجل'}

💰 **البيانات المالية والاستحقاقات:**
• الراتب الأساسي: **${baseSalary.toLocaleString()} ${currency}**
• إجمالي البدلات: **${totalAllowances.toLocaleString()} ${currency}** (سكن: ${housing.toLocaleString()} | انتقال: ${transport.toLocaleString()} | أخرى: ${other.toLocaleString()})
• الراتب الإجمالي (Gross): **${grossSalary.toLocaleString()} ${currency}**
• استقطاع التأمينات الاجتماعية (11%): **${gosi.toLocaleString()} ${currency}**
• صافي الراتب التقديري الشهري: **${netSalary.toLocaleString()} ${currency}**

📋 **السلف والعهد وسجل الحضور:**
• **السلف النشطة:** ${
        empLoans.length > 0
          ? empLoans
              .map(
                (l) =>
                  `${Number(l.amount).toLocaleString()} ${currency} (قسط شهري: ${Number(
                    l.monthlyInstallment
                  ).toLocaleString()} ${currency} - متبقي: ${Number(l.remainingAmount).toLocaleString()} ${currency})`
              )
              .join('، ')
          : 'لا توجد سلف نشطة'
      }
• **العهد العينية المسلمة:** ${
        empAssets.length > 0
          ? empAssets.map((a) => `${a.name} (${a.assetCode || 'بدون كود'})`).join('، ')
          : 'لا توجد عهد مسجلة بحوزته'
      }
• **الحضور والانضباط:** إجمالي المسجل له ${empAtt.length} يوم (${
        lateAtt.length > 0
          ? `${lateAtt.length} مرات تأخير بإجمالي ${totalDelayMin} دقيقة`
          : 'ملتزم بدون أي تأخيرات'
      })

هل ترغب في صياغة خطاب إداري باسم هذا الموظف (إنذار، لفت نظر، شهادة خبرة) أو حساب مستحقات نهاية خدمته؟`;
    }
  }

  // -------------------------------------------------------------
  // 2. Department Search (استعلام عن موظفي قسم معين)
  // -------------------------------------------------------------
  if (
    q.includes('قسم') &&
    (q.includes('مين') || q.includes('موظفين') || q.includes('من هم') || q.includes('عرض') || q.includes('قائمة'))
  ) {
    const matchedDept = departments.find((d) => q.includes(d.name.toLowerCase())) ||
      departments.find((d) => q.includes(d.name.toLowerCase().replace('قسم', '').trim()));

    const targetDeptName = matchedDept ? matchedDept.name : null;
    const deptEmployees = targetDeptName
      ? employees.filter((e) => (e.department || '').toLowerCase() === targetDeptName.toLowerCase())
      : [];

    if (deptEmployees.length > 0) {
      const totalDeptSalaries = deptEmployees.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0);
      return `🏢 **موظفو ${targetDeptName} (${deptEmployees.length} موظف):**
إجمالي الرواتب الأساسية للقسم: **${totalDeptSalaries.toLocaleString()} ${currency}**

${deptEmployees
  .map(
    (e, idx) =>
      `${idx + 1}. **${e.name}** — ${e.position} | الراتب: ${Number(e.baseSalary || 0).toLocaleString()} ${currency}`
  )
  .join('\n')}

💡 *يمكنك كتابة اسم أي موظف منهم للحصول على تفاصيل ملفه الشامل!*`;
    }
  }

  // -------------------------------------------------------------
  // 3. Greetings & Introductions (التحيات والتعريف)
  // -------------------------------------------------------------
  if (
    /^(سلام|السلام عليكم|مرحبا|اهلا|أهلا|صباح الخير|مساء الخير|ازيك|إزيك|عامل ايه|هاي|hello|hi|مرحب|هلا|تحية)\b/i.test(msg) ||
    (q.includes('من انت') || q.includes('من أنت') || q.includes('عرف نفسك') || q.includes('مين انت') || q.includes('مين أنت') || q.includes('وظيفتك'))
  ) {
    return `أهلاً وسهلاً بك! 👋 أنا **مساعد الموارد البشرية الذكي (Smart HR Bot)**.
أنا متصل مباشرة بالقاعدة الحية لشركتك (${employees.length} موظف مسجل) وجاهز للرد الفوري على كل ما يخص:

1️⃣ **ملفات الموظفين:** اكتب اسم أو كود أي موظف لمعرفة راتبه، بدلاته، حضوره، وسلفه فوراً.
2️⃣ **الحسابات المالية الدقيقة:** مكافأة نهاية الخدمة، ساعات الإضافي (Overtime)، التأمينات (11% و 18.75%)، الضرائب، وصافي الراتب.
3️⃣ **قوانين العمل واللوائح:** فترات الاختبار، الإجازات، لجان التحقيق، لائحة الجزاءات، والاستقالات ومهلة الإخطار.
4️⃣ **الصياغة الإدارية الفورية:** خطابات الإنذار ولفت النظر، شهادات الخبرة، عروض العمل (Job Offers)، وأسئلة المقابلات الشخصية.
5️⃣ **استخدام نظام Smart HR:** شرح كيفية إضافة موظف، اعتماد الرواتب، تسجيل البصمة أو حضور الموبايل.

اكتب سؤالك بحرية أو جرب: *"احسب مكافأة نهاية الخدمة لراتب 15000 بعد 6 سنوات"* أو *"اعطني إحصائيات الموظفين والرواتب"*!`;
  }

  // -------------------------------------------------------------
  // 4. Statistics & Workforce Summary (إحصائيات قوة العمل والرواتب)
  // -------------------------------------------------------------
  if (
    (q.includes('احصائيات') || q.includes('إحصائيات') || q.includes('ملخص') || q.includes('بيانات النظام') || q.includes('قائمة الموظفين') || q.includes('اسماء الموظفين') || q.includes('أسماء الموظفين') || q.includes('عرض الموظفين') || q.includes('كم موظف') || q.includes('عدد الموظفين'))
  ) {
    const totalEmp = employees.length;
    const totalBase = employees.reduce((acc, e) => acc + (Number(e.baseSalary) || 0), 0);
    const totalAllowances = employees.reduce((acc, e) => acc + (Number(e.housingAllowance) || 0) + (Number(e.transportAllowance) || 0) + (Number(e.otherAllowances) || 0), 0);
    const activeLoans = loans.filter((l) => l.status === 'نشط');
    const totalLoansAmount = activeLoans.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

    const deptCounts: Record<string, number> = {};
    employees.forEach((e) => {
      const d = e.department || 'غير محدد';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const deptBreakdown = Object.entries(deptCounts)
      .map(([d, c]) => `• ${d}: **${c} موظف**`)
      .join('\n');

    const topEmployeesList = employees
      .slice(0, 8)
      .map((e, i) => `${i + 1}. **${e.name}** (${e.position || 'موظف'} - ${e.department || 'عام'}) — الأساسي: ${Number(e.baseSalary || 0).toLocaleString()} ${currency}`)
      .join('\n');

    return `📊 **ملخص إحصائيات الموارد البشرية الحية في النظام:**

👥 **إجمالي الموظفين:** **${totalEmp} موظف**
💵 **إجمالي الرواتب الأساسية:** **${totalBase.toLocaleString()} ${currency}** شهرياً
➕ **إجمالي البدلات الشهرية:** **${totalAllowances.toLocaleString()} ${currency}**
💳 **السلف النشطة:** **${activeLoans.length} سلفة** بإجمالي **${totalLoansAmount.toLocaleString()} ${currency}**
💻 **العهد المسجلة:** **${assets.length} عهدة**

🏢 **توزيع الموظفين على الأقسام:**
${deptBreakdown || '• لا توجد أقسام مسجلة حالياً'}

📋 **عينة من الموظفين المسجلين:**
${topEmployeesList || '• لا يوجد موظفون مسجلون حالياً'}

💡 *اكتب اسم أي موظف لمعرفة تفاصيل ملفه بالكامل فوراً!*`;
  }

  // -------------------------------------------------------------
  // 5. End of Service / Severance (مكافأة نهاية الخدمة)
  // -------------------------------------------------------------
  if (
    q.includes('نهاية الخدم') ||
    q.includes('نهايه الخدم') ||
    q.includes('مكافأة نهاية') ||
    q.includes('مستحقات نهاية') ||
    q.includes('مكافأه نهايه') ||
    (combinedContext.includes('نهاية الخدم') && numbersInMsg.length > 0)
  ) {
    const salary = numbersInMsg.find((n) => n >= 1000) || 15000;
    const years = numbersInMsg.find((n) => n > 0 && n < 60) || 5;
    const first5Years = Math.min(years, 5);
    const remainingYears = Math.max(0, years - 5);
    const rewardFirst5 = first5Years * (salary * 0.5);
    const rewardAfter5 = remainingYears * salary;
    const totalReward = rewardFirst5 + rewardAfter5;

    return `🧮 **حساب مكافأة نهاية الخدمة (وفق قانون العمل):**

📌 **القاعدة القانونية لحساب المكافأة:**
• يستحق العامل أجر **نصف شهر** عن كل سنة من السنوات الخمس الأولى.
• يستحق العامل أجر **شهر كامل** عن كل سنة من السنوات التالية للسنة الخامسة.
• يُحسب كسر السنة بنسبة ما قضاه العامل منها في الخدمة.

💵 **الحساب التطبيقي لأرقامك (${salary.toLocaleString()} ${currency} لمدة ${years} سنوات):**
1. عن أول ${first5Years} سنوات (نصف شهر × ${first5Years}): **${rewardFirst5.toLocaleString()} ${currency}**
2. عن السنوات المتبقية (${remainingYears} سنة × شهر كامل): **${rewardAfter5.toLocaleString()} ${currency}**
✅ **إجمالي مكافأة نهاية الخدمة المستحقة:** **${totalReward.toLocaleString()} ${currency}**

📌 **في حالة الاستقالة:**
• خدمة أقل من سنتين: لا يستحق مكافأة.
• خدمة من سنتين إلى 5 سنوات: يستحق **ثلث المكافأة** (${Math.round(totalReward / 3).toLocaleString()} ${currency}).
• خدمة من 5 إلى 10 سنوات: يستحق **ثلثي المكافأة** (${Math.round((totalReward * 2) / 3).toLocaleString()} ${currency}).
• خدمة أكثر من 10 سنوات أو إنهاء من طرف الشركة أو بلوغ سن التقاعد: يستحق **المكافأة كاملة** (${totalReward.toLocaleString()} ${currency}).`;
  }

  // -------------------------------------------------------------
  // 6. Overtime Calculation (الساعات الإضافية والأوفر تايم)
  // -------------------------------------------------------------
  if (
    q.includes('اضافي') ||
    q.includes('إضافي') ||
    q.includes('اوفر تايم') ||
    q.includes('أوفر تايم') ||
    q.includes('overtime') ||
    (combinedContext.includes('إضافي') && numbersInMsg.length > 0)
  ) {
    const salary = numbersInMsg.find((n) => n >= 1000) || 12000;
    const hours = numbersInMsg.find((n) => n > 0 && n < 300) || 10;
    const hourlyRate = salary / 30 / 8;
    const standard15Overtime = Math.round(hourlyRate * 1.5 * hours);
    const dayOvertime = Math.round(hourlyRate * 1.35 * hours);
    const nightOvertime = Math.round(hourlyRate * 1.7 * hours);
    const holidayOvertime = Math.round(hourlyRate * 2.0 * hours);

    return `⏱️ **حساب أجر الساعات الإضافية (Overtime):**

📐 **معادلة حساب أجر الساعة العادية:**
• الراتب الأساسي ÷ 30 يوماً ÷ 8 ساعات = قيمة أجر الساعة الواحدة.
• لراتب **${salary.toLocaleString()} ${currency}** ⬅️ قيمة أجر الساعة = **${hourlyRate.toFixed(2)} ${currency}**

💰 **أجر (${hours} ساعات إضافية) حسب نوع الوردية والتوقيت:**
• **المعامل القياسي للنظام (1.5x):** **${standard15Overtime.toLocaleString()} ${currency}** (الساعة = ${(hourlyRate * 1.5).toFixed(2)} ${currency})
• **إضافي نهاري قانوني (1.35x):** **${dayOvertime.toLocaleString()} ${currency}**
• **إضافي ليلي قانوني (1.70x):** **${nightOvertime.toLocaleString()} ${currency}**
• **أيام الراحات الأسبوعية والعطلات الرسمية (2.0x):** **${holidayOvertime.toLocaleString()} ${currency}**

💡 *يمكنك كتابة: "احسب 8 ساعات إضافي لراتب 18000" لحسابها فوراً!*`;
  }

  // -------------------------------------------------------------
  // 7. Social Insurance & Taxes (التأمينات الاجتماعية والضرائب)
  // -------------------------------------------------------------
  if (
    q.includes('تأمين') ||
    q.includes('تامين') ||
    q.includes('ضريب') ||
    q.includes('ضرائب') ||
    q.includes('كسب العمل') ||
    q.includes('حصة العامل') ||
    q.includes('حصة صاحب العمل') ||
    q.includes('صافي الراتب') ||
    q.includes('استقطاع')
  ) {
    const salary = numbersInMsg.find((n) => n >= 1000) || 15000;
    const empShare = Math.round(salary * 0.11);
    const companyShare = Math.round(salary * 0.1875);
    const totalInsurance = empShare + companyShare;
    const annualGross = (salary - empShare) * 12;
    const personalExemption = 20000;
    const taxableAnnual = Math.max(0, annualGross - personalExemption);
    const estimatedMonthlyTax = Math.round((taxableAnnual * 0.10) / 12);
    const netSalary = salary - empShare - estimatedMonthlyTax;

    return `🛡️ **حساب التأمينات الاجتماعية وضريبة كسب العمل:**

📊 **النسب المقررة للتأمينات الاجتماعية (قانون 148):**
• **حصة الموظف (المستقطعة من راتبه):** **11%**
• **حصة صاحب العمل (تتحملها المنشأة):** **18.75%**
• **إجمالي الاشتراك التأميني الكامل:** **29.75%**

💵 **الحساب العملي لراتب (${salary.toLocaleString()} ${currency}):**
1. **استقطاع التأمينات من الموظف (11%):** **${empShare.toLocaleString()} ${currency}**
2. **مساهمة المنشأة في التأمينات (18.75%):** **${companyShare.toLocaleString()} ${currency}**
3. **إجمالي المبلغ المسدد لهيئة التأمينات:** **${totalInsurance.toLocaleString()} ${currency}**
4. **ضريبة كسب العمل الشهرية التقديرية:** **${estimatedMonthlyTax.toLocaleString()} ${currency}**
✅ **صافي الراتب المستحق للصرف:** **${netSalary.toLocaleString()} ${currency}**`;
  }

  // -------------------------------------------------------------
  // 8. Probation Period (فترة الاختبار والتجربة)
  // -------------------------------------------------------------
  if (
    q.includes('اختبار') ||
    q.includes('تجرب') ||
    q.includes('فترة التجربة') ||
    q.includes('فترة الاختبار') ||
    q.includes('ثلاث شهور') ||
    q.includes('3 شهور')
  ) {
    return `⏳ **ضوابط فترة الاختبار (Probation Period) في قانون العمل:**

1️⃣ **المدة القانونية:**
• يجب أن يُنص عليها صراحة في عقد العمل، ولا يجوز أن تزيد عن **3 أشهر** كحد أقصى.
• لا يجوز تعيين العامل تحت الاختبار أكثر من مرة واحدة لدى نفس صاحب العمل.

2️⃣ **حقوق وإنهاء العقد خلال فترة الاختبار:**
• يحق لصاحب العمل إنهاء العقد إذا ثبت عدم كفاءة أو صلاحية العامل للوظيفة، دون التزام بمكافأة نهاية الخدمة، ولكن يُلزم بتسليم أجر أيام العمل الفعلية فوراً.
• يبدأ الاشتراك في التأمينات الاجتماعية من اليوم الأول لمباشرة العمل الفعلي ولا يجوز تأجيلها لما بعد فترة الاختبار.

3️⃣ **بعد اجتياز فترة الاختبار:**
• تُحسب مدة فترة الاختبار ضمن مدة خدمة العامل الإجمالية لاستحقاق رصيد الإجازات السنوية والمكافآت.`;
  }

  // -------------------------------------------------------------
  // 9. Resignation, Notice Period & Termination (الاستقالة وفترة الإخطار)
  // -------------------------------------------------------------
  if (
    q.includes('استقال') ||
    q.includes('فصل') ||
    q.includes('انهاء عقد') ||
    q.includes('إنهاء عقد') ||
    q.includes('مهلة الاخطار') ||
    q.includes('مهلة الإخطار') ||
    q.includes('فسخ العقد') ||
    q.includes('ترك العمل') ||
    q.includes('تعويض الفصل')
  ) {
    return `📑 **أحكام الاستقالة وفترة الإخطار وإنهاء العقد في قانون العمل:**

1️⃣ **الاستقالة:**
• يجب أن تكون مكتوبة وموقعة من العامل شخصياً.
• تعتبر الاستقالة مقبولة بمرور **10 أيام عمل** من تاريخ تقديمها ما لم يرد صاحب العمل كتابياً بالرفض أو التأجيل لمصلحة العمل.
• يحق للعامل العدول عن استقالته كتابياً خلال أسبوع من تاريخ تقديمها.

2️⃣ **مهلة الإخطار (Notice Period):**
• في العقود غير محددة المدة: شهران إخطار مسبق إذا كانت مدة الخدمة أقل من 10 سنوات، و3 أشهر إذا تجاوزت الخدمة 10 سنوات.
• إذا أنهى صاحب العمل العقد دون مراعاة مهلة الإخطار، يلتزم بسداد تعويض مالي يعادل أجر مهلة الإخطار كاملة.

3️⃣ **الفصل التأديبي والمادة 69:**
• حالات الفصل القانوني: ثبوت انتحال شخصية أو تزوير مستندات، إفشاء أسرار العمل، ارتكاب خطأ جسيم ينتج عنه خسارة جسيمة، أو الغياب بدون عذر مقبول لأكثر من 20 يوماً متقطعة أو 10 أيام متصلة خلال السنة (بشرط توجيه إنذار كتابي رسمي بعد 5 أيام متصلة أو 10 أيام متقطعة).`;
  }

  // -------------------------------------------------------------
  // 10. Leaves & Vacations (الإجازات السنوية والعارضة والرسمية والمرضية)
  // -------------------------------------------------------------
  if (
    q.includes('اجاز') ||
    q.includes('إجاز') ||
    q.includes('عارض') ||
    q.includes('مرضي') ||
    q.includes('سنوي') ||
    q.includes('رصيد') ||
    q.includes('عطل') ||
    q.includes('عيد') ||
    q.includes('اعياد') ||
    q.includes('وضع') ||
    q.includes('حج') ||
    q.includes('وفاة') ||
    q.includes('زواج')
  ) {
    return `🌴 **دليل وأرصدة الإجازات الرسمية وفق قانون العمل:**

1️⃣ **الإجازة السنوية الاعتيادية:**
• **21 يوماً** بأجر كامل لمن أمضى سنة كاملة في خدمة المنشأة (تستحق بنسبة المدة لمن أمضى 6 أشهر).
• ترتفع إلى **30 يوماً** لمن أمضى 10 سنوات في الخدمة أو لمن تجاوز سن **الخمسين عاماً**.

2️⃣ **الإجازة العارضة:**
• حدها الأقصى **6 أيام سنوياً**، وتكون بحد أقصى **يومين في المرة الواحدة**، وتُخصم من رصيد الإجازة السنوية.

3️⃣ **الإجازة المرضية:**
• تثبت بتقرير طبي معتمد من الهيئة العامة للتأمين الصحي، وتُصرف بنسبة 75% إلى 85% من الأجر التأميني.

4️⃣ **إجازات المناسبات الخاصة (مدفوعة الأجر):**
• **إجازة الوضع للسيدات العاملات:** 90 يوماً بأجر كامل بحد أقصى 3 مرات طوال مدة الخدمة.
• **إجازة رعاية الطفل:** يحق للعاملة إجازة بدون أجر لرعاية طفلها حتى عامين بحد أقصى مرتين.
• **إجازة الحج / زيارة بيت المقدس:** شهر كامل بأجر كامل لمرة واحدة بعد 5 سنوات خدمة.
• **إجازة الزواج ووفاة الأقارب:** من 3 إلى 5 أيام بأجر كامل.`;
  }

  // -------------------------------------------------------------
  // 11. Attendance, Lateness & Penalties (الحضور والغياب والجزاءات)
  // -------------------------------------------------------------
  if (
    q.includes('تأخير') ||
    q.includes('تاخير') ||
    q.includes('غياب') ||
    q.includes('جزاء') ||
    q.includes('خصم') ||
    q.includes('انصراف') ||
    q.includes('حضور') ||
    q.includes('بصم') ||
    q.includes('سماح')
  ) {
    const presentToday = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const lateRecords = attendance.filter((a) => a.status === 'late' || (a.delayMinutes && a.delayMinutes > 0));

    return `⏰ **لوائح الحضور، التأخيرات، ولائحة الجزاءات الإدارية:**

📈 **الوضع الحالي في سجلات الحضور بالنظام:**
• إجمالي سجلات الحضور المسجلة: **${attendance.length} سجل**
• عدد الحاضرين اليوم: **${presentToday}** | حالات التأخير: **${lateRecords.length} حالة**

⚖️ **التدرج التأديبي القانوني للجزاءات:**
1. **الإنذار ولفت النظر الكتابي:** في المخالفة الأولى البسيطة أو التأخير بعد نفاد فترة السماح المقررة.
2. **الخصم المالي المتدرج:** خصم ربع يوم ⬅️ خصم نصف يوم ⬅️ خصم يوم كامل حسب تكرار المخالفة خلال الشهر.
3. **الحد الأقصى للخصم:** **لا يجوز خصم أكثر من أجر 5 أيام في الشهر الواحد** كجزاء تأديبي مهما تعددت المخالفات حمايةً للحد الأدنى للمعيشة.
4. **الغياب بدون إذن:** يُخصم أجر أيام الغياب الفعلية + توقيع الجزاء التأديبي، ويتم إنذار الموظف بعد غياب 5 أيام متصلة أو 10 أيام متقطعة.`;
  }

  // -------------------------------------------------------------
  // 12. Loans & Company Custody (السلف المالية والعهد العينية)
  // -------------------------------------------------------------
  if (
    q.includes('سلف') ||
    q.includes('قرض') ||
    q.includes('قسط') ||
    q.includes('عهد') ||
    q.includes('لابتوب') ||
    q.includes('سيارة') ||
    q.includes('جهاز') ||
    q.includes('مخزن')
  ) {
    const activeLoans = loans.filter((l) => l.status === 'نشط');
    const totalLoansVal = activeLoans.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const assignedAssets = assets.filter((a) => a.status === 'مع موظف');

    return `💼 **إدارة السلف المالية والعهد العينية:**

💳 **السلف المالية في النظام (${activeLoans.length} سلفة نشطة بإجمالي ${totalLoansVal.toLocaleString()} ${currency}):**
${
  activeLoans.length > 0
    ? activeLoans
        .map(
          (l) =>
            `• **${l.employeeName}**: إجمالي السلفة ${Number(l.amount).toLocaleString()} ${currency} | القسط: ${Number(
              l.monthlyInstallment
            ).toLocaleString()} ${currency} (المتبقي: ${Number(l.remainingAmount).toLocaleString()} ${currency})`
        )
        .join('\n')
    : '• لا توجد سلف نشطة مسجلة حالياً.'
}

💻 **العهد المسلمة للموظفين (${assignedAssets.length} عهدة قيد الاستخدام):**
${
  assignedAssets.length > 0
    ? assignedAssets
        .slice(0, 6)
        .map((a) => `• **${a.name}** ⬅️ بحوزة: **${a.assignedToName}**`)
        .join('\n')
    : '• جميع العهد متوفرة بالمخزن أو لم تسجل عهد بعد.'
}

⚖️ **الضابط القانوني لاستقطاع السلف:**
• لا يجوز أن يزيد الاستقطاع الشهري لسداد سلف صاحب العمل عن **10% من الأجر الأساسي** للعامل دون احتساب أي فوائد.`;
  }

  // -------------------------------------------------------------
  // 13. Payroll, Allowances & Closing (مسير الرواتب والبدلات والإقفال)
  // -------------------------------------------------------------
  if (
    q.includes('مرتب') ||
    q.includes('رواتب') ||
    q.includes('راتب') ||
    q.includes('مسير') ||
    q.includes('كشف') ||
    q.includes('اعتماد') ||
    q.includes('بدل') ||
    q.includes('بدلات') ||
    q.includes('مفردات')
  ) {
    const totalNet = payroll.reduce((acc, p) => acc + (Number(p.netSalary) || 0), 0);
    const approvedCount = payroll.filter((p) => p.status === 'approved').length;

    return `💵 **دليل مسيرات الرواتب، البدلات، وإجراءات الإقفال الشهري:**

📊 **بيانات الرواتب المسجلة في النظام:**
• عدد مسيرات الرواتب: **${payroll.length} مسير** (${approvedCount} معتمد)
• إجمالي صافي الرواتب المستحقة: **${totalNet.toLocaleString()} ${currency}**

📌 **أنواع البدلات الأكثر شيوعاً:**
• **بدل سكن وبدل انتقال:** تُضاف للراتب الإجمالي.
• **بدل طبيعة عمل أو مخاطر مهنية:** يُمنح لأصحاب المهن الشاقة أو الفنية.

✅ **خطوات اعتماد كشف الرواتب بدون أخطاء:**
1. ترحيل سجلات الحضور والانصراف وحساب الساعات الإضافية والخصومات.
2. مراجعة الاستقطاعات التأمينية وأقساط السلف النشطة.
3. مراجعة المكافآت والحوافز الممنوحة للشهر.
4. الضغط على زر "اعتماد مسير الرواتب" لإنشاء كشوفات الصرف وقسائم الرواتب (Payslips).`;
  }

  // -------------------------------------------------------------
  // 14. Administrative Letters & Templates (صياغة الخطابات الرسمية)
  // -------------------------------------------------------------
  if (
    q.includes('صياغ') ||
    q.includes('اكتب') ||
    q.includes('نموذج') ||
    q.includes('خطاب') ||
    q.includes('انذار') ||
    q.includes('إنذار') ||
    q.includes('لفت نظر') ||
    q.includes('شهادة خبر') ||
    q.includes('عقد عمل') ||
    q.includes('ترقي') ||
    q.includes('عرض عمل') ||
    q.includes('مفردات مرتب')
  ) {
    if (q.includes('انذار') || q.includes('إنذار') || q.includes('لفت نظر')) {
      return `📄 **نموذج رسمي: خطاب لفت نظر / إنذار إداري**

---
**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}
**إلى السيد/ة:** [اسم الموظف] — **الكود الوظيفي:** [رقم الكود]
**القسم:** [اسم القسم] — **المسمى الوظيفي:** [المسمى الوظيفي]

**الموضوع: لفت نظر بخصوص الالتزام بضوابط العمل ومواعيده الرسمية**

تحية طيبة وبعد،،
بالإشارة إلى مراجعة سجلات الحضور والتقارير الإدارية، تلاحظ للإدارة عدم الالتزام بمواعيد الحضور والانصراف المقررة / التقصير في المهام المكلف بها خلال الفترة الماضية.
وحيث إن هذا المسلك يتعارض مع لائحة تنظيم العمل والانضباط الداخلي للشركة، فإن الإدارة توجه لسيادتكم هذا الإخطار الرسمي بلفت النظر، وتهيب بكم ضرورة تلافي هذه الملاحظات والالتزام التام بتعليمات العمل مستقبلاً لتجنب تطبيق الجزاءات المنصوص عليها قانوناً.

**وتفضلوا بقبول فائق التقدير والاحترام،،**
**مدير الموارد البشرية:** .................... | توقيع الموظف بالعلم: ....................
---`;
    }

    if (q.includes('خبرة') || q.includes('خبره')) {
      return `📄 **نموذج رسمي: شهادة خبرة معتمدة**

---
**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}

**شـهـادة خـبـرة وعـمـل**

تشهد إدارة الموارد البشرية بشركة **[اسم الشركة]** بأن السيد/ **......................................**، يحمل رقم قومي (**........................**)، قد عمل لدينا بالشركة بوظيفة (**........................**) في قسم (**................**)، وذلك اعتباراً من **..../..../202** وحتى **..../..../202**.

وخلال فترة عمله معنا، كان مثالاً للموظف المجتهد الملتزم بأخلاقيات العمل ومعايير الجودة المهنية، وقد أعطيت له هذه الشهادة بناءً على طلبه لتقديمها إلى من يهمه الأمر دون أدنى مسؤولية على الشركة تجاه الغير.

**مدير الموارد البشرية** | خاتم وتوقيع الشركة: ....................
---`;
    }

    if (q.includes('عرض عمل') || q.includes('offer')) {
      return `📄 **نموذج رسمي: عرض عمل وظيفي (Job Offer Letter)**

---
**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}
**إلى السيد/ة:** [اسم المرشح]

**يسر شركة [اسم الشركة] أن تقدم لسيادتكم عرض عمل للانضمام لفريقنا وفقاً للشروط التالية:**
• **المسمى الوظيفي:** [المسمى المطلوب]
• **القسم / الإدارة:** [القسم]
• **الراتب الأساسي:** [المبلغ] ${currency} شهرياً
• **البدلات الممنوحة:** بدل سكن [ ] + بدل انتقال [ ]
• **نوع العقد وساعات العمل:** عقد دوام كامل (8 ساعات يومياً)
• **فترة الاختبار:** 3 أشهر تبدأ من تاريخ مباشرة العمل الفعلي
• **تاريخ بدء العمل المتوقع:** ..../..../202

يرجى التوقيع بالموافقة وإعادة إرسال النسخة خلال 3 أيام عمل من تاريخه.
**مدير الموارد البشرية:** .................... | توقيع المرشح بالقبول: ....................
---`;
    }

    return `📝 **نماذج الخطابات الإدارية الجاهزة للصياغة الفورية:**
اختر أو اطلب أي نموذج تريده وسأقوم بكتابته وصياغته لك ببيانات شركتك فوراً:
1. **خطاب لفت نظر أو إنذار غياب**
2. **شهادة خبرة معتمدة**
3. **عرض عمل رسمي (Job Offer)**
4. **بيان ومفردات راتب موجه لجهة رسمية/بنكية**
5. **قرار ترقية وزيادة راتب**`;
  }

  // -------------------------------------------------------------
  // 15. Interviews & Recruitment (المقابلات والتوظيف وأسئلة STAR)
  // -------------------------------------------------------------
  if (
    q.includes('مقابل') ||
    q.includes('انترفيو') ||
    q.includes('توظيف') ||
    q.includes('اسئلة') ||
    q.includes('أسئلة') ||
    q.includes('مرشح') ||
    q.includes('سيرة ذاتية') ||
    q.includes('cv') ||
    q.includes('ats')
  ) {
    return `🎯 **دليل المقابلات الشخصية وأسئلة التوظيف الاحترافية (STAR Method):**

1️⃣ **الأسئلة السلوكية والقيادية:**
• *"احكِ لي عن موقف واجهت فيه ضغط عمل شديد أو موعداً نهائياً ضيقاً، وكيف تصرفت لإنهاء المهمة؟"* (يقيس إدارة الضغوط والأولويات).
• *"صف مشكلة معقدة حدثت مع زميل أو عميل، وما هي الخطوات التي اتخذتها لحلها؟"* (يقيس الذكاء العاطفي وحل النزاعات).

2️⃣ **الأسئلة الفنية والتشغيلية:**
• *"ما هي أهم إنجازاتك في وظيفتك السابقة وما الأثر المالي أو التشغيلي الذي حققته؟"*
• *"كيف تضمن جودة المخرجات وتلافي الأخطاء المتكررة في مهامك اليومية؟"*

3️⃣ **تقييم المرشح عبر نظام Smart HR:**
• يمكنك استخدام قسم **تحليل السير الذاتية (ATS)** برفع ملفات الـ PDF وسيقوم النظام بمقارنة مهارات المرشح وخبراته بالوصف الوظيفي واستخراج أفضل 10 مرشحين فوراً!`;
  }

  // -------------------------------------------------------------
  // 16. How to use Smart HR System (دليل استخدام النظام وميزاته)
  // -------------------------------------------------------------
  if (
    q.includes('كيف') ||
    q.includes('ازاي') ||
    q.includes('طريقة') ||
    q.includes('شرح') ||
    q.includes('سيستم') ||
    q.includes('نظام') ||
    q.includes('خطوات') ||
    q.includes('١٠٠٠') ||
    q.includes('1000') ||
    q.includes('باسوورد') ||
    q.includes('باسورد')
  ) {
    if (q.includes('1000') || q.includes('١٠٠٠') || q.includes('موبايل')) {
      return `📱 **شرح ميزة مستخدم 1000 وحضور الموبايل:**
• تم تصميم حساب الباسورد **1000** ليفتح شاشة "حضور الموبايل GPS" فقط للموظفين.
• يمنع هذا الحساب الموظف من رؤية باقي أقسام النظام أو الرواتب للحفاظ على الخصوصية.
• يتم إدخال كود الموظف مرة واحدة ويتم تثبيته فورياً لمنع التبديل أو التلاعب.
• تظهر تسجيلات الحضور والانصراف الناتجة فوراً في جدول الحضور والانصراف العام للنظام مع إحداثيات الـ GPS!`;
    }

    if (q.includes('موظف') && (q.includes('اضاف') || q.includes('إضاف') || q.includes('جديد'))) {
      return `👤 **كيفية إضافة موظف جديد في نظام Smart HR:**
1. افتح تبويب **"شؤون الموظفين"** من القائمة الجانبية.
2. اضغط على زر **"إضافة موظف جديد"** أعلى الجدول.
3. املأ البيانات الأساسية (الاسم، الكود، القسم، المسمى الوظيفي، الهاتف، الراتب الأساسي والبدلات).
4. يمكنك تحديد نسبة التأمينات والبيانات التأمينية.
5. اضغط **"حفظ"**، وسيظهر الموظف فوراً في كافة مسيرات الرواتب والحضور!`;
    }

    if (q.includes('حضور') || q.includes('بصم')) {
      return `⏰ **طرق تسجيل الحضور والانصراف في النظام:**
1. **الربط مع جهاز البصمة (ZKTeco):** من تبويب "إدارة الورديات والحضور" ⬅️ الربط المباشر عبر IP الشبكة.
2. **حضور الموبايل بالـ GPS:** عبر شاشة الموبايل أو باسورد 1000 للتحقق من النطاق الجغرافي للمنشأة.
3. **التسجيل اليدوي السريع:** من جدول الحضور بالضغط على زر تسجيل حضور يدوي.`;
    }

    if (q.includes('راتب') || q.includes('رواتب') || q.includes('مسير')) {
      return `💵 **كيفية إنشاء واعتماد مسير الرواتب:**
1. انتقل إلى تبويب **"مسير الرواتب"**.
2. اختر الشهر والسنة المراد احتسابهما.
3. يجمع النظام تلقائياً بيانات الراتب الأساسي + البدلات + الساعات الإضافية - الخصومات - أقساط السلف - التأمينات.
4. راجع الأرقام ثم اضغط على زر **"اعتماد مسير الرواتب"** لطباعة قسائم الصرف (Payslips).`;
    }
  }

  // -------------------------------------------------------------
  // 17. Instant Numbers Calculation (تحليل أي أرقام يكتبها المستخدم)
  // -------------------------------------------------------------
  if (numbersInMsg.length > 0) {
    const val = numbersInMsg[0];
    const gosi = Math.round(val * 0.11);
    const dayWage = Math.round(val / 30);
    const hourWage = (val / 30 / 8).toFixed(2);
    return `🔢 **تحليل مالي فوري للمبلغ (${val.toLocaleString()} ${currency}) في حسابات الموارد البشرية:**

• **قيمة أجر اليوم الواحد (على 30 يوم):** ${dayWage.toLocaleString()} ${currency}
• **قيمة أجر الساعة العادية (8 ساعات):** ${hourWage} ${currency}
• **قيمة ساعة الإضافي (1.5x):** ${(Number(hourWage) * 1.5).toFixed(2)} ${currency}
• **خصم التأمينات الاجتماعية للموظف (11%):** ${gosi.toLocaleString()} ${currency}
• **مساهمة المنشأة في التأمينات (18.75%):** ${Math.round(val * 0.1875).toLocaleString()} ${currency}
• **صافي الراتب التقديري بعد التأمينات:** ${(val - gosi).toLocaleString()} ${currency}

هل ترغب في استخدام هذا المبلغ لحساب **مكافأة نهاية الخدمة** أو **الساعات الإضافية** لعدد ساعات محدد؟ فقط أخبرني!`;
  }

  // -------------------------------------------------------------
  // 18. Default Smart HR Consultation (استشارة تفاعلية شاملة)
  // -------------------------------------------------------------
  return `مرحباً بك! بخصوص استفسارك حول: **"${msg}"** 💡

بصفتي مساعد الموارد البشرية لنظام **Smart HR** (المتصل حالياً بـ **${employees.length} موظف** مسجل)، يمكنني إفادتك فوراً بالتالي:
• **للاستعلام عن موظف:** اكتب اسمه أو كوده لمعرفة تفاصيل راتبه، بدلاته، حضوره، وسلفه.
• **للحسابات المالية الدقيقة:** اكتب مثلاً *"احسب إضافي 12 ساعة لراتب 15000"* أو *"احسب مكافأة نهاية الخدمة لراتب 18000 بعد 6 سنوات"*.
• **للصياغات الإدارية:** اطلب *"نموذج إنذار غياب"*، *"شهادة خبرة"*، أو *"عرض عمل وظيفي"*.
• **للقوانين واللوائح:** اسألني عن فترات الاختبار، الاستقالة والإخطار، الإجازات، أو لائحة الجزاءات.

كيف تفضل أن نساعدك في هذه الخطوة؟`;
}
