import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

const teacherSchema = z.object({
  name: z.string().min(3, "نام لکھیں"),
  email: z.string().email("درست ای میل لکھیں"),
  password: z.string().optional(), // Edit mode mein optional
});

export default function TeacherForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  const [canCollectFee, setCanCollectFee] = useState(false);
  const [canRegisterStudent, setCanRegisterStudent] = useState(false);
  const [canDeleteStudent, setCanDeleteStudent] = useState(false);
  const [canManageClasses, setCanManageClasses] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(teacherSchema),
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchTeacher = async () => {
        setIsFetching(true);
        try {
          const res = await apiClient.get('/users');
          const teacher = res.data.data.find((t: any) => t._id === id);
          if (teacher) {
            reset({ name: teacher.name, email: teacher.email, password: '' });
            setCanCollectFee(teacher.permissions?.canCollectFee || false);
            setCanRegisterStudent(teacher.permissions?.canRegisterStudent || false);
            setCanDeleteStudent(teacher.permissions?.canDeleteStudent || false);
            setCanManageClasses(teacher.permissions?.canManageClasses || false);
          }
        } catch (error) { toast.error('ڈیٹا لوڈ نہیں ہو سکا'); } 
        finally { setIsFetching(false); }
      };
      fetchTeacher();
    }
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const finalData = {
        ...data,
        permissions: { canCollectFee, canRegisterStudent, canDeleteStudent, canManageClasses }
      };
      
      if (isEditMode) {
        await apiClient.put(`/users/${id}`, finalData);
        toast.success('استاد کی معلومات اپڈیٹ ہو گئیں!');
      } else {
        await apiClient.post('/users', finalData);
        toast.success('استاد کا اکاؤنٹ کامیابی سے بن گیا!');
      }
      navigate('/teachers');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'محفوظ نہیں ہو سکا');
    } finally { setIsLoading(false); }
  };

  if (isFetching) return <div className="p-10 text-center text-xl">ڈیٹا لوڈ ہو رہا ہے...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border mt-4">
      
      {/* 🔥 Back Button */}
      <Button variant="ghost" onClick={() => navigate('/teachers')} className="mb-4 text-gray-600 hover:text-emerald-700">
        <ArrowRight className="ml-2 h-5 w-5" /> واپس جائیں
      </Button>

      <h2 className="text-2xl font-bold text-emerald-900 mb-6 border-b pb-4">
        {isEditMode ? 'استاد کی معلومات تبدیل کریں' : 'نیا استاد شامل کریں'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-lg">استاد کا نام</Label>
            <Input {...register("name")} placeholder="قاری عبداللہ" className="h-12" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg">ای میل (Login ID)</Label>
            <div className="relative">
              <Input {...register("email")} placeholder="teacher@madarsa.com" dir="ltr" readOnly={isEditMode} className={`h-12 ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} />
              {isEditMode && <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />}
            </div>
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message as string}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-lg">پاس ورڈ {isEditMode && "(خالی چھوڑیں اگر تبدیل نہیں کرنا)"}</Label>
          <Input type="password" {...register("password")} placeholder="••••••••" dir="ltr" className="h-12" />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message as string}</p>}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-lg text-gray-700">اجازتیں (Permissions)</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={canCollectFee} onChange={(e) => setCanCollectFee(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded" />
            <span className="text-lg">فیس وصول کرنے کی اجازت ہے</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={canRegisterStudent} onChange={(e) => setCanRegisterStudent(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded" />
            <span className="text-lg">نیا داخلہ کرنے کی اجازت ہے</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={canDeleteStudent} onChange={(e) => setCanDeleteStudent(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded" />
            <span className="text-lg">طالب علم ڈیلیٹ کرنے کی اجازت ہے</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={canManageClasses} onChange={(e) => setCanManageClasses(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded" />
            <span className="text-lg">کلاسز اور فیس مینج کرنے کی اجازت ہے</span>
          </label>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-lg">
          {isLoading ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2" />}
          {isLoading ? 'محفوظ ہو رہا ہے...' : (isEditMode ? 'تبدیلیاں محفوظ کریں' : 'اکاؤنٹ بنائیں')}
        </Button>
      </form>
    </div>
  );
}