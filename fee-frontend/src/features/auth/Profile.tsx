import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  name: z.string().min(3, "نام کم از کم 3 حروف کا ہونا چاہیے"),
  password: z.string().optional(),
});

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      password: '',
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiClient.put('/auth/profile', data);
      if (res.data.success) {
        updateUser(res.data.data, res.data.data.token);
        toast.success('پروفائل کامیابی سے اپڈیٹ ہو گئی!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'اپڈیٹ کرنے میں مسئلہ آیا');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border mt-4">
      
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-gray-600 hover:text-emerald-700 -ml-4">
        <ArrowRight className="ml-2 h-5 w-5" /> واپس جائیں
      </Button>

      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
          <User size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">میری پروفائل</h2>
          <p className="text-gray-500 text-sm">اپنا نام اور پاس ورڈ تبدیل کریں</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-2">
          <Label className="text-lg text-gray-700">ای میل (لاگ ان آئی ڈی)</Label>
          <Input 
            value={user?.email || ''} 
            readOnly 
            dir="ltr" 
            className="h-12 text-lg bg-gray-100 cursor-not-allowed" 
          />
        </div>

        <div className="space-y-2">
          <Label className="text-lg text-gray-700">نام</Label>
          <Input {...register("name")} className="h-12 text-lg" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2 bg-amber-50 p-4 rounded-lg border border-amber-100">
          <Label className="text-lg text-gray-700 flex items-center gap-2">
            <KeyRound size={18} /> نیا پاس ورڈ (اختیاری)
          </Label>
          <Input 
            type="password" 
            {...register("password")} 
            placeholder="اگر پاس ورڈ تبدیل نہیں کرنا تو خالی چھوڑیں" 
            dir="ltr" 
            className="h-12 text-lg bg-white" 
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-lg">
          {isLoading ? <Loader2 className="animate-spin ml-2" /> : null}
          {isLoading ? 'محفوظ ہو رہا ہے...' : 'پروفائل اپڈیٹ کریں'}
        </Button>
      </form>
    </div>
  );
}