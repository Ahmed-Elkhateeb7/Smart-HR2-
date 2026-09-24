import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Server,
  HelpCircle,
  ExternalLink,
  Code,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { BiometricDevice, BiometricSyncSettings } from '../../types';
import { generatePythonBridgeScript } from '../../utils/biometricSync';

interface BiometricBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: BiometricDevice[];
  settings: BiometricSyncSettings;
}

export const BiometricBridgeModal: React.FC<BiometricBridgeModalProps> = ({
  isOpen,
  onClose,
  devices,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);
  const pythonScript = generatePythonBridgeScript(devices, settings);

  const batchFileContent = `@echo off
chcp 65001 >nul
title ZKTeco Live Sync Bridge Agent
echo ====================================================================
echo        جاري تشغيل برنامج ربط وسحب البصمات ZKTeco Live Sync Bridge
echo ====================================================================
echo.
echo [*] فحص بايثون وتثبيت المكتبات اللازمة...
python -m pip install --quiet pyzk schedule
echo.
echo [*] بدء سحب البصمات من جهاز البصمة...
python zk_sync_agent.py
pause
`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zk_sync_agent.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBat = () => {
    const blob = new Blob([batchFileContent], { type: 'application/x-bat;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'run_zk_bridge.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 my-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                برنامج جسر الربط التلقائي للشبكة المحلية (Local LAN Bridge)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                سكربت تشغيل فوري لسحب البصمات الحقيقية من جهاز ZKTeco وحفظ ملف attlog.dat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Windows 1-Click Runner Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-bold text-purple-950 dark:text-purple-100">
                  طريقة التشغيل السريعة بنقرة واحدة (ويندوز):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>1. تحميل سكربت zk_sync_agent.py</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBat}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>2. تحميل مشغل الويندوز run_zk_bridge.bat</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
              <p className="font-bold text-slate-800 dark:text-slate-100">خطوات التشغيل البسيطة:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>قم بوضع الملفين <strong className="font-mono text-purple-600">zk_sync_agent.py</strong> و <strong className="font-mono text-indigo-600">run_zk_bridge.bat</strong> في نفس المجلد (مثلاً على سطح المكتب).</li>
                <li>انقر نقراً مزدوجاً (Double Click) على ملف <strong className="font-mono text-indigo-600">run_zk_bridge.bat</strong> لتشغيله مباشرة دون كتابة أوامر.</li>
                <li>سيقوم بتثبيت المكتبات تلقائياً، والاتصال بجهاز البصمة (192.168.2.254) وحفظ ملف <strong className="font-mono text-emerald-600">attlog.dat</strong> في نفس المجلد.</li>
              </ol>
            </div>
          </div>

          {/* Troubleshooting Card */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="font-bold flex items-center gap-2 text-sm text-amber-950 dark:text-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>إذا لم يفتح السكربت أو أغلقت النافذة فوراً (حل المشكلة):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>تثبيت بايثون مع خيار PATH:</strong> عند تثبيت Python من الموقع الرسمي، تأكد من وضع علامة صح على <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded font-mono font-bold">Add Python to PATH</code> في أول خطوة بالتثبيت.</li>
              <li><strong>التشغيل عبر موجه الأوامر (CMD):</strong> افتح CMD واكتب: <code className="px-1.5 py-0.5 bg-slate-800 text-white rounded font-mono" dir="ltr">pip install pyzk schedule</code> ثم <code className="px-1.5 py-0.5 bg-slate-800 text-white rounded font-mono" dir="ltr">python zk_sync_agent.py</code></li>
              <li><strong>البديل المباشر:</strong> يمكنك دوماً تنزيل ملف البصمات من شاشة الجهاز بالمتصفح (Download Records) ورفعه عبر زر <strong className="text-amber-700 dark:text-amber-300">"استيراد ملفات البصمة (.dat)"</strong> فوراً.</li>
            </ul>
          </div>

          {/* Code Viewer with Quick Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-purple-600" />
                <span>كود السكربت الكامل المحدث (Python zk_sync_agent.py)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-200 max-h-64 overflow-y-auto text-left" dir="ltr">
              <pre>{pythonScript}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-3 bg-slate-50/70 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

