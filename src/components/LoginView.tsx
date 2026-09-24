import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCheck, Sparkles, Users, Activity } from 'lucide-react';

interface LoginViewProps {
  onLogin: (password: string) => { success: boolean; message?: string };
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate slight network delay for better UX
    setTimeout(() => {
      const result = onLogin(password);
      if (!result.success) {
        setError(result.message || 'حدث خطأ أثناء تسجيل الدخول');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans overflow-hidden" dir="rtl">
      
      {/* Right Side (RTL) - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 z-10 relative bg-white dark:bg-slate-900 shadow-2xl">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-2xl shadow-blue-600/30 flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6">
              <ShieldCheck className="w-10 h-10 text-white transform -rotate-3" />
            </div>
            
            <h1 className="mt-8 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm">
              Smart HR
            </h1>
            <h2 className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">
              نظام إدارة الموارد البشرية
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
              المنصة الذكية المتكاملة لإدارة الكوادر البشرية بكل كفاءة وسهولة.
            </p>
          </div>

          <div className="mt-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور للوصول
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pr-11 px-4 py-3.5 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                    placeholder="أدخل كلمة المرور..."
                    dir="ltr"
                  />
                </div>

              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-600/20 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <UserCheck className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Left Side (LTR) - Visual Banner */}
      <div className="hidden lg:block relative flex-1 bg-slate-900 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 opacity-90 z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-600/20 to-transparent z-0 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl z-0"></div>
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtNGgtdjRoLTR2NGgtdjRoNHY0aDR2LTRoNHptMC0zaC0zdi0zaDN2M3ptLTcgNXYtM2gtM3YzaDN2M3ptLTctNXYtM2gtM3YzaDN2M3oiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=')] opacity-20 z-0"></div>

        <div className="relative z-10 flex flex-col justify-center h-full p-20 text-white">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold text-white/90">الإصدار الذكي 2026</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
              مستقبل إدارة الموارد البشرية يبدأ من هنا.
            </h2>
            
            <p className="text-lg text-blue-100/80 mb-12 font-medium leading-relaxed">
              تحكم كامل في مسيرات الرواتب، متابعة دقيقة للحضور والانصراف، وإدارة متطورة لهيكلة المؤسسة من واجهة واحدة صممت خصيصاً للارتقاء ببيئة العمل.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 transition-colors hover:bg-white/10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h4 className="font-bold text-white">إدارة ذكية</h4>
                  <p className="text-xs text-blue-200/70 mt-1">تتبع كفاءة الموظفين</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 transition-colors hover:bg-white/10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-bold text-white">تحليل فوري</h4>
                  <p className="text-xs text-blue-200/70 mt-1">تقارير وأداء حي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
