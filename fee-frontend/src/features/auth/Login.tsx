import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const loginSchema = z.object({
  email: z.string().email("درست ای میل درج کریں / Enter valid email"),
  password: z.string().min(6, "پاس ورڈ کم از کم 6 حروف کا ہو / Min 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      
      // 🔥 Professional Fix: Response structure ko safely handle karna
      const responseData = response.data.data || response.data;
      
      if (responseData.token) {
        // Zustand store mein user aur token save karein
        login(responseData, responseData.token);
        
        toast.success('کامیابی سے لاگ ان ہو گئے ہیں!');
        
        // 🔥 Dashboard ya Home page par redirect karein
        navigate('/'); 
      } else {
        toast.error('ٹوکن موصول نہیں ہوئی، دوبارہ کوشش کریں');
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || 'ای میل یا پاس ورڈ غلط ہے');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4fdf7] p-4 font-urdu relative overflow-hidden">
      
      {/* 🔥 PROFESSIONAL ANIMATED BACKGROUND */}
      <motion.div 
        animate={{ y: [0, -30, 0], x: [0, 20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-125 max-h-125 bg-emerald-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"
      />
      <motion.div 
        animate={{ y: [0, 40, 0], x: [0, -20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] max-w-125 max-h-125 bg-teal-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] max-w-100 max-h-100 bg-green-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30"
      />

      {/* 🔥 MAIN CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 p-8 md:p-12 pb-16 relative z-10"
      >
        
        {/* Header Section */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="text-center mb-10"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="bg-linear-to-br from-emerald-500 to-teal-700 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200/50 hover:scale-105 hover:rotate-3 transition-all duration-300">
              <LogIn size={40} className="text-white ml-1" />
            </div>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
            Madarsa Faiz Ul Quran
          </motion.h1>
          
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-emerald-800 mb-4">
            مدرسہ فیض القرآن
          </motion.h2>

          {/* 🔥 EXACT ORNAMENTAL DESIGN */}
          <motion.div variants={itemVariants} className="flex items-center justify-center mb-4">
            <svg width="220" height="30" viewBox="0 0 220 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-600 opacity-80">
              <path d="M110 5 L115 15 L110 25 L105 15 Z" fill="currentColor"/>
              <path d="M90 15 C90 15 100 0 110 15 C100 30 90 15 90 15 Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M130 15 C130 15 120 0 110 15 C120 30 130 15 130 15 Z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="80" cy="15" r="2" fill="currentColor"/>
              <circle cx="140" cy="15" r="2" fill="currentColor"/>
              <line x1="10" y1="15" x2="70" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="150" y1="15" x2="210" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.div>

          <motion.p variants={itemVariants} className="text-gray-500 text-sm font-medium">
            برائے مہربانی لاگ ان کریں / Please Login
          </motion.p>
        </motion.div>

        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="space-y-2">
            <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
              ای میل / Email (Username)
            </Label>
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-300" />
              </div>
              <Input 
                {...register("email")} 
                placeholder="admin@madarsa.com" 
                dir="ltr"
                className="h-14 text-lg pl-4 pr-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all rounded-2xl"
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-sm">
                  {errors.email.message as string}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="space-y-2">
            <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
              پاس ورڈ / Password
            </Label>
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-300" />
              </div>
              <Input 
                type={showPassword ? "text" : "password"} 
                {...register("password")} 
                placeholder="Enter Password / پاس ورڈ لکھیں" 
                dir="ltr"
                className="h-14 text-lg pl-12 pr-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all rounded-2xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-sm">
                  {errors.password.message as string}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-xl rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1 transition-all duration-300 mt-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={24} /> لاگ ان ہو رہے ہیں...
                </span>
              ) : (
                "لاگ ان کریں / Login"
              )}
            </Button>
          </motion.div>
        </form>

        {/* Footer inside Card */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-10 text-center text-xs text-gray-400"
        >
          <p dir="ltr" className="font-mono">© {new Date().getFullYear()} Madarsa Faiz Ul Quran.</p>
          <p className="mt-2">System Design by <span className="font-bold text-emerald-700">Irfanz Solutions</span></p>
        </motion.div>
      </motion.div>
    </div>
  );
}