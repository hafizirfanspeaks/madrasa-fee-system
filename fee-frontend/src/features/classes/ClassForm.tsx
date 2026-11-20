import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// 🔥 ArrowRight import kiya hai
import { Loader2, Save, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

const classSchema = z.object({
  className: z.string().min(1, "کلاس کا نام درج کریں"),
  sections: z.string().min(1, "سیکشن منتخب کریں"),
  admissionFee: z.coerce.number().min(0, "فیس درست درج کریں"),
  monthlyFee: z.coerce.number().min(0, "فیس درست درج کریں"),
});

export default function ClassForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      sections: "A"
    }
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchClass = async () => {
        setIsFetching(true);
        try {
          const res = await apiClient.get('/classes');
          const cls = res.data.data.find((c: any) => c._id === id);
          if (cls) {
            reset({
              className: cls.className,
              sections: cls.sections.join(','),
              admissionFee: cls.admissionFee,
              monthlyFee: cls.monthlyFee,
            });
          }
        } catch (error) {
          toast.error('کلاس کا ڈیٹا لوڈ نہیں ہو سکا');
        } finally {
          setIsFetching(false);
        }
      };
      fetchClass();
    }
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const sectionArray = data.sections === "All" 
        ? ["A", "B", "C"] 
        : data.sections.split(',').map((s: string) => s.trim());

      const formattedData = {
        ...data,
        sections: sectionArray
      };

      if (isEditMode) {
        delete formattedData.className; 
        await apiClient.put(`/classes/${id}`, formattedData);
        toast.success('کلاس کی فیس کامیابی سے اپڈیٹ کر لی گئی!');
      } else {
        await apiClient.post('/classes', formattedData);
        toast.success('کلاس اور فیس کامیابی سے محفوظ کر لی گئی!');
      }
      navigate('/classes'); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'محفوظ نہیں ہو سکا');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-10 text-center text-xl">ڈیٹا لوڈ ہو رہا ہے...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border mt-4">
      
      {/* 🔥 Back Button */}
      <Button variant="ghost" onClick={() => navigate('/classes')} className="mb-4 text-gray-600 hover:text-emerald-700 -ml-4">
        <ArrowRight className="ml-2 h-5 w-5" /> واپس جائیں
      </Button>

      <h2 className="text-2xl font-bold text-emerald-900 mb-6 border-b pb-4">
        {isEditMode ? 'کلاس کی فیس تبدیل کریں' : 'کلاس اور فیس متعین کریں'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-2">
          <Label className="text-lg">کلاس کا نام <span className="text-red-500">*</span></Label>
          
          {isEditMode ? (
            <div className="relative">
              <Input 
                {...register("className")} 
                readOnly 
                className="h-12 text-lg bg-gray-100 cursor-not-allowed border-gray-300 pr-10" 
              />
              <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              <p className="text-xs text-amber-600 mt-1">کلاس کا نام تبدیل نہیں کیا جا سکتا</p>
            </div>
          ) : (
            <select 
              {...register("className")} 
              className={`w-full border rounded-md px-3 text-lg h-12 bg-white outline-none cursor-pointer ${errors.className ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">-- کلاس منتخب کریں --</option>
              <option value="قاعدہ">قاعدہ</option>
              <option value="ناظرہ">ناظرہ</option>
              <option value="حفظ">حفظ</option>
              <option value="تربیت حفظ">تربیت حفظ</option>
              <option value="تعلیم و تربیت">تعلیم و تربیت</option>
            </select>
          )}
          {errors.className && <p className="text-red-500 text-sm mt-1">{errors.className.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-lg">سیکشنز <span className="text-red-500">*</span></Label>
          <select 
            {...register("sections")} 
            className={`w-full border rounded-md px-3 text-lg h-12 bg-white outline-none cursor-pointer ${errors.sections ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="A">صرف سیکشن A</option>
            <option value="B">صرف سیکشن B</option>
            <option value="A,B">سیکشن A اور B</option>
            <option value="A,B,C">سیکشن A, B اور C</option>
            <option value="All">تمام سیکشنز (All)</option>
          </select>
          {errors.sections && <p className="text-red-500 text-sm mt-1">{errors.sections.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <div className="space-y-2">
            <Label className="text-lg">داخلہ فیس (روپے) <span className="text-red-500">*</span></Label>
            <Input type="number" {...register("admissionFee")} dir="ltr" className="h-12 font-mono bg-white" placeholder="مثلاً 1000" />
            {errors.admissionFee && <p className="text-red-500 text-sm mt-1">{errors.admissionFee.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg">ماہانہ فیس (روپے) <span className="text-red-500">*</span></Label>
            <Input type="number" {...register("monthlyFee")} dir="ltr" className="h-12 font-mono bg-white" placeholder="مثلاً 500" />
            {errors.monthlyFee && <p className="text-red-500 text-sm mt-1">{errors.monthlyFee.message as string}</p>}
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-lg">
          {isLoading ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2" />}
          {isLoading ? 'محفوظ ہو رہا ہے...' : (isEditMode ? 'فیس میں تبدیلی محفوظ کریں' : 'فیس کے ساتھ کلاس محفوظ کریں')}
        </Button>
      </form>
    </div>
  );
}