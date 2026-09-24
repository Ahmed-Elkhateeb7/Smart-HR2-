import express from 'express';
import path from 'path';
import net from 'net';
import ZKLib from 'node-zklib';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiInstance;
}

// AI Endpoint 1: Generate Job Description
app.post('/api/ai/job-description', async (req, res) => {
  const { jobTitle = '', department = '', seniorityLevel = '', keySkills = '' } = req.body || {};

  const buildFastJobDescription = () => {
    const titleStr = jobTitle || 'مسمى وظيفي';
    const deptStr = department || 'الموارد البشرية والتطوير';
    const levelStr = seniorityLevel || 'متوسط الخبرة';
    const skillsList = keySkills
      ? keySkills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['حل المشكلات', 'إدارة الوقت والأولويات', 'التواصل الفعال'];

    return {
      title: titleStr,
      summary: `توصيف وظيفي متكامل لمسمى ${titleStr} في قسم ${deptStr}. يختص هذا الدور بتنفيذ الخطط التشغيلية، ومتابعة الأداء اليومي، وتحقيق أعلى معايير الجودة والإنتاجية وفقاً لمتطلبات مستوى الخبرة (${levelStr}).`,
      responsibilities: [
        `التخطيط والتنفيذ المباشر لكافة الأعمال اليومية المتعلقة بـ ${titleStr}`,
        `المشاركة في وضع الخطط التشغيلية وتطوير آليات العمل بـ ${deptStr}`,
        'متابعة وتطبيق أعلى معايير الجودة والسلامة المهنية بالشركة',
        'إعداد والرفع بالتقارير الدورية والإحصائيات للإدارة المباشرة',
        'التنسيق والتكامل الفعال مع باقي الأقسام وفرق العمل ذات الصلة'
      ],
      requiredSkills: [
        'القدرة على التحليل السريع واتخاذ القرارات التشغيلية',
        'إتقان برامج الحاسوب والتطبيقات الحديثة ذات الصلة بالعمل',
        'العمل الجماعي والقدرة على تحمل ضغوط العمل',
        ...skillsList
      ],
      kpis: [
        'نسبة إنجاز المهام المطلوبة في المواعيد المحددة (Target: 95%)',
        'معدل انخفاض الأخطاء التشغيلية وجودة المخرجات (Target: < 2%)',
        'معدل رضا الإدارة والعملاء الداخليين/الخارجيين (Target: 90%)',
        'مدى الالتزام بسياسات ولائحة العمل والتعليمات المباشرة'
      ],
      suggestedSalaryRange: '15,000 - 28,000 جنيه مصري'
    };
  };

  try {
    const ai = getGemini();

    if (!ai) {
      return res.json({ success: true, data: buildFastJobDescription() });
    }

    const prompt = `أنت خبير موارد بشرية متميز في إعداد التوصيف الوظيفي ومؤشرات الأداء KPI's باللغة العربية لسوق العمل المصري.
يرجى إنتاج توصيف وظيفي موجز ومباشر ومؤشرات أداء دقيقة بصيغة JSON حصرية للمسمى:
- المسمى الوظيفي: ${jobTitle}
- القسم: ${department || 'عام'}
- مستوى الخبرة: ${seniorityLevel || 'متوسط'}
- المهارات: ${keySkills || 'مهارات مهنية متميزة'}

أرجع JSON حصري بالهيكل التالي:
{
  "title": "${jobTitle || 'اسم الوظيفة'}",
  "summary": "ملخص الوظيفة في 2-3 جمل",
  "responsibilities": ["مهام 1", "مهام 2", "مهام 3", "مهام 4", "مهام 5"],
  "requiredSkills": ["مهارة 1", "مهارة 2", "مهارة 3", "مهارة 4"],
  "kpis": ["مؤشر أداء 1", "مؤشر أداء 2", "مؤشر أداء 3", "مؤشر أداء 4"],
  "suggestedSalaryRange": "نطاق الراتب بالجنيه المصري EGP (مثال: 18,000 - 30,000 جنيه مصري)"
}`;

    // Fast generation using gemini-3.6-flash with low thinking level & timeout
    const fetchAiPromise = ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

    const result = await Promise.race([fetchAiPromise, timeoutPromise]);

    if (result && result.text) {
      const parsed = JSON.parse(result.text);
      return res.json({ success: true, data: parsed });
    }

    // Fast fallback if timeout reached or empty result
    return res.json({ success: true, data: buildFastJobDescription() });
  } catch (error: any) {
    console.log('Fast fallback used for job description:', error?.message);
    return res.json({ success: true, data: buildFastJobDescription() });
  }
});

// AI Endpoint 2: Smart HR Assistant Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGemini();

    if (!ai) {
      return res.json({
        success: true,
        reply: `مرحباً بك! أنا مساعد Smart HR الذكي.
استجابة نموذجية: بالنسبة لسؤالك حول "${message}"، فإن سياسات الموارد البشرية ونظام العمل تدعو إلى مراجعة سجلات الحضور، واعتماد الساعات الإضافية وفق نسبة 1.5x للوقت الإضافي، والتأكد من توثيق العهد والمستندات قبل اعتماد مسير الرواتب.
(ملاحظة: يمكنك إضافة GEMINI_API_KEY للحصول على إجابات مخصصة ودقيقة لحظياً).`
      });
    }

    const systemInstruction = `أنت "Smart HR Bot" المساعد الذكي لنظام Smart HR لإدارة الموارد البشرية.
تحدث باللغة العربية بأسلوب مهني وأنيق وواضح.
قم بمساعدة مدراء HR والأجوبة على استفسارات نظام العمل، الإجازات، مكافأة نهاية الخدمة، التأمينات الاجتماعية، وتدقيق ملفات الموظفين والرواتب.
حافظ على الإجابات منظمة باستخدام النقاط والرموز التعبيرية الخفيفة المناسبة.`;

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction,
      },
    });

    // Send history if provided
    if (history && Array.isArray(history)) {
      for (const item of history) {
        if (item.text) {
          await chat.sendMessage({ message: item.text });
        }
      }
    }

    const response = await chat.sendMessage({ message: message || 'مرحبا' });
    return res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error('Error in HR Chat:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء التواصل مع المساعد الذكي' });
  }
});

// AI Endpoint 3: Payroll Guard Smart Audit
app.post('/api/ai/audit-payroll', async (req, res) => {
  try {
    const { employees, attendance, loans } = req.body;
    const ai = getGemini();

    if (!ai) {
      const empCount = employees ? employees.length : 0;
      const loanCount = loans ? loans.length : 0;
      return res.json({
        success: true,
        auditSummary: empCount === 0 ? "لا يوجد بيانات للموظفين لفحصها حالياً." : `تم فحص بيانات ${empCount} موظف بنجاح (وضع التجربة - بدون مفتاح API).`,
        alerts: empCount === 0 ? [] : [
          {
            id: 'al-1',
            type: 'info',
            title: 'إشعار فحص أولي',
            description: `النظام يعمل في وضع التجربة. تم رصد ${loanCount} سلف قائمة ستعالج تلقائياً.`,
            actionNeeded: 'مراجعة عامة'
          }
        ]
      });
    }

    const prompt = `أنت خبير تدقيق رواتب وموارد بشرية (حارس المرتبات - Payroll Guard).
لديك قائمة الموظفين التالية وسجلاتهم:
الموظفون: ${JSON.stringify(employees.slice(0, 5))}
السلف: ${JSON.stringify(loans)}

قم بتحليل هذه البيانات واكتشاف أي أخطاء أو مخاطر قبل اعتماد المرتبات (مثال: مستندات منتهية، سلف لم تُخصم، رواتب غير متوازنة).
أرجِع النتيجة بصيغة JSON باللغة العربية كالتالي:
{
  "auditSummary": "ملخص الفحص الذكي للرواتب",
  "alerts": [
    {
      "id": "معرف فريد",
      "type": "warning | danger | info",
      "title": "عنوان التنبيه",
      "description": "تفاصيل التنبيه",
      "actionNeeded": "الإجراء المطلوب"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Mobile Attendance & Geofencing Endpoints
function calculateHaversineDistanceServer(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371000 * c * 10) / 10;
}

app.post('/api/attendance/geofence-calculate', (req, res) => {
  const { userLat, userLng, companyLat, companyLng, allowedRadius = 50 } = req.body || {};
  const uLat = Number(userLat);
  const uLng = Number(userLng);
  const cLat = Number(companyLat);
  const cLng = Number(companyLng);
  const radius = Number(allowedRadius) || 50;

  if (isNaN(uLat) || isNaN(uLng) || isNaN(cLat) || isNaN(cLng)) {
    return res.status(400).json({
      success: false,
      message: 'إحداثيات غير صالحة. يرجى توفير خط العرض وخط الطول بدقة.',
    });
  }

  const distance = calculateHaversineDistanceServer(uLat, uLng, cLat, cLng);
  const inRange = distance <= radius;

  return res.json({
    success: true,
    inRange,
    distanceMeters: distance,
    allowedRadiusMeters: radius,
    differenceMeters: Math.round(Math.abs(distance - radius) * 10) / 10,
    message: inRange
      ? `الموظف داخل النطاق الجغرافي المسموح (المسافة: ${distance} متر)`
      : `الموظف خارج النطاق الجغرافي بمسافة (${distance} متر). الحد الأقصى هو ${radius} متر.`,
  });
});

app.post('/api/attendance/mobile-punch', (req, res) => {
  const {
    employeeId,
    employeeCode,
    employeeName,
    punchType = 'check_in',
    userLat,
    userLng,
    companyLat = 30.0444,
    companyLng = 31.2357,
    allowedRadius = 50,
    allowOutside = false,
  } = req.body || {};

  const uLat = Number(userLat);
  const uLng = Number(userLng);
  const cLat = Number(companyLat);
  const cLng = Number(companyLng);
  const radius = Number(allowedRadius) || 50;

  if (isNaN(uLat) || isNaN(uLng)) {
    return res.status(400).json({
      success: false,
      inRange: false,
      message: 'تعذر التحقق من الموقع: يرجى تفعيل إذن الـ GPS في هاتفك والتقاط الإحداثيات قبل التسجيل.',
    });
  }

  const distance = calculateHaversineDistanceServer(uLat, uLng, cLat, cLng);
  const inRange = distance <= radius;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hours}:${minutes}`;
  const timestamp = `${dateStr} ${timeStr}:${String(now.getSeconds()).padStart(2, '0')}`;

  if (!inRange && !allowOutside) {
    return res.json({
      success: false,
      inRange: false,
      distanceMeters: distance,
      allowedRadiusMeters: radius,
      punchType,
      timestamp,
      timeStr,
      dateStr,
      message: `عذراً! أنت خارج النطاق الجغرافي لمقر الشركة بمسافة (${distance} متر). الحد الأقصى المسموح به هو (${radius} متر).`,
    });
  }

  return res.json({
    success: true,
    inRange,
    distanceMeters: distance,
    allowedRadiusMeters: radius,
    punchType,
    timestamp,
    timeStr,
    dateStr,
    message:
      punchType === 'check_in'
        ? `تم تسجيل حضورك بنجاح (${inRange ? 'داخل النطاق' : 'خارج النطاق مع تنبيه'}) على بُعد ${distance} متر!`
        : `تم تسجيل انصرافك بنجاح (${inRange ? 'داخل النطاق' : 'خارج النطاق مع تنبيه'}) على بُعد ${distance} متر!`,
  });
});

// Biometric Endpoint 1: Real TCP/IP Network Connection Diagnostic
app.post('/api/biometric/test-device', async (req, res) => {
  const { ip = '', port = 4370, timeout = 3500 } = req.body || {};
  const cleanIp = String(ip).trim();
  const cleanPort = Number(port) || 4370;

  if (!cleanIp) {
    return res.json({
      success: false,
      message: 'يرجى إدخال عنوان IP الخاص بجهاز البصمة.',
      latencyMs: 0,
    });
  }

  // Check if IP is private local LAN (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const isPrivate = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(cleanIp);

  if (isPrivate) {
    return res.json({
      success: false,
      isPrivateIp: true,
      latencyMs: 0,
      message: `تنبيه هام: العنوان (${cleanIp}) هو عنوان داخلي (Local LAN IP) على شبكة الراوتر لديك ولا يمكن للسيرفر السحابي الوصول إليه مباشرة. بما أنك قمت بفتح Port Forwarding في الراوتر للمنفذ ${cleanPort}، يرجى كتابة الـ Public IP الخارجي للراوتر (مثل 156.xxx.xxx.xxx) أو عنوان الـ DDNS في خانة عنوان IP الجهاز.`,
    });
  }

  // Real connection test via socket & ZKLib
  const startTime = Date.now();
  try {
    const ZKClient = (ZKLib as any).default || ZKLib;
    const zk = new ZKClient(cleanIp, cleanPort, Math.min(Number(timeout) || 3500, 6000), 5200);
    await zk.createSocket();
    const latency = Date.now() - startTime;
    await zk.disconnect().catch(() => {});

    return res.json({
      success: true,
      latencyMs: latency,
      message: `تم الاتصال الحقيقي بجهاز البصمة بنجاح عبر الإنترنت (${cleanIp}:${cleanPort})! زمن الاستجابة: ${latency}ms.`,
    });
  } catch (err: any) {
    // If ZKLib socket had an error, try basic TCP socket probe as fallback
    const socket = new net.Socket();
    let isHandled = false;

    const timer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        socket.destroy();
        return res.json({
          success: false,
          latencyMs: 0,
          message: `انتهت مهلة الاتصال بالـ Public IP (${cleanIp}:${cleanPort}). تأكد من أن منفذ ${cleanPort} مفتوح في الراوتر وموجه إلى 192.168.2.254 وأن جدار حماية الراوتر يسمح بحزم TCP/UDP.`,
        });
      }
    }, Math.min(Number(timeout) || 3500, 6000));

    socket.connect(cleanPort, cleanIp, () => {
      if (!isHandled) {
        isHandled = true;
        clearTimeout(timer);
        const latency = Date.now() - startTime;
        socket.destroy();
        return res.json({
          success: true,
          latencyMs: latency,
          message: `تم الوصول للمنفذ ${cleanPort} على الـ IP (${cleanIp}) بنجاح! زمن الاستجابة: ${latency}ms.`,
        });
      }
    });

    socket.on('error', (sockErr: any) => {
      if (!isHandled) {
        isHandled = true;
        clearTimeout(timer);
        socket.destroy();
        return res.json({
          success: false,
          latencyMs: 0,
          errorCode: sockErr.code || 'ERR_CONNECTION',
          message: `فشل الاتصال بالـ IP (${cleanIp}:${cleanPort}): تأكد من كتابة الـ Public IP الحقيقي أو اسم DDNS وتوجيه بورت ${cleanPort} في الراوتر.`,
        });
      }
    });
  }
});

// Biometric Endpoint 2: Real live sync logs fetching from public IP / device
app.post('/api/biometric/sync-device', async (req, res) => {
  const { device } = req.body || {};
  const ip = String(device?.ip || '').trim();
  const port = Number(device?.port) || 4370;

  if (!ip) {
    return res.json({
      success: false,
      logs: [],
      message: 'بيانات الجهاز غير مكتملة (يرجى تحديد عنوان IP).',
    });
  }

  const isPrivate = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);
  if (isPrivate) {
    return res.json({
      success: false,
      isPrivateIp: true,
      logs: [],
      message: `لا يمكن الاتصال المباشر بعنوان محلي (${ip}) من السحابة. بما أنك قمت بعمل Port Forwarding، يرجى كتابة الـ Public IP الخاص بالراوتر في إعدادات الجهاز بدلاً من ${ip}.`,
    });
  }

  try {
    const ZKClient = (ZKLib as any).default || ZKLib;
    const zk = new ZKClient(ip, port, 10000, 5200);
    await zk.createSocket();
    const users = await zk.getUsers().catch(() => ({ data: [] }));
    const attendances = await zk.getAttendances().catch(() => ({ data: [] }));
    await zk.disconnect().catch(() => {});

    const rawLogs = Array.isArray(attendances?.data) ? attendances.data : [];
    const formattedLogs = rawLogs.map((item: any, idx: number) => ({
      id: `live-zk-${Date.now()}-${idx}`,
      deviceIp: ip,
      devicePort: port,
      employeeCode: String(item.deviceUserId || item.uid || item.user_id || idx + 1),
      timestamp: item.recordTime ? new Date(item.recordTime).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19),
      punchType: item.punch === 0 ? 'check_in' : 'check_out',
      verifyType: 'fingerprint',
      rawText: `${item.deviceUserId || item.uid}\t${item.recordTime}\t1\t0\t1\t0`,
    }));

    return res.json({
      success: true,
      logs: formattedLogs,
      usersCount: users?.data?.length || 0,
      totalLogs: formattedLogs.length,
      message: `تم سحب ${formattedLogs.length} حركة حضور وانصراف حقيقية من جهاز البصمة بنجاح!`,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      logs: [],
      message: `تعذر سحب البيانات من الجهاز (${ip}:${port}): ${err.message || 'انتهت المهلة'}. يرجى التحقق من توجيه المنفذ في الراوتر.`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart HR Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
