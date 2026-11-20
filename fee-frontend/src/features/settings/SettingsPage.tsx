import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🔥 Import kiya
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useSettingsStore } from '@/store/settings.store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// 🔥 ArrowRight import kiya
import { Loader2, Save, Settings, ArrowRight } from 'lucide-react';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { settings, fetchSettings } = useSettingsStore();
  const { register, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // 🔥 Hook use kiya

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiClient.put('/settings', data);
      await fetchSettings(); 
      queryClient.invalidateQueries(); 
      toast.success('معلومات کامیابی سے محفوظ ہو گئیں!');
    } catch (error) {
      toast.error('محفوظ نہیں ہو سکا');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border mt-4">
      
      {/* 🔥 Back Button */}
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-gray-600 hover:text-emerald-700 -ml-4">
        <ArrowRight className="ml-2 h-5 w-5" /> واپس جائیں
      </Button>

      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="bg-emerald-100 p-3 rounded-full text-emerald-700"><Settings size={28} /></div>
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-900">مدرسہ کی معلومات (Settings)</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-lg">مدرسہ کا نام</Label>
          <Input {...register("madarsaName")} className="h-12 text-lg" />
        </div>
        <div className="space-y-2">
          <Label className="text-lg">پتہ (Address)</Label>
          <Input {...register("address")} className="h-12 text-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-lg">فون نمبر</Label>
            <Input {...register("phone")} dir="ltr" className="h-12 text-lg" />
          </div>
          <div className="space-y-2">
            <Label className="text-lg">ای میل</Label>
            <Input {...register("email")} dir="ltr" className="h-12 text-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-lg">فوٹر ٹیکسٹ (PDF کے نیچے)</Label>
          <Input {...register("footerText")} className="h-12 text-lg" />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-lg h-14">
          {isLoading ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2" />}
          معلومات محفوظ کریں
        </Button>
      </form>
    </div>
  );
}