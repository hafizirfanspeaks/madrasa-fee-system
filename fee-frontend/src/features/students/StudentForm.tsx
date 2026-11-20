import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// 🔥 ArrowRight import kiya hai
import { Loader2, UserPlus, Save, Download, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useSettingsStore } from '@/store/settings.store';
import { generateGlobalPDF } from '@/utils/PDFService';

const studentSchema = z.object({
  studentName: z.string().min(3, "طالب علم کا نام کم از کم 3 حروف کا ہونا چاہیے"),
  guardianName: z.string().min(3, "سرپرست کا نام کم از کم 3 حروف کا ہونا چاہیے"),
  contactNumber: z.string().regex(/^03\d{9}$/, "درست موبائل نمبر لکھیں (مثلاً 03001234567)"),
  department: z.string().min(1, "شعبہ منتخب کریں"),
  classId: z.string().min(1, "کلاس منتخب کرنا لازمی ہے"),
  section: z.string().min(1, "سیکشن منتخب کریں"),
  monthlyFee: z.coerce.number().min(0),
  admissionFee: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).default(0),
  installmentPlan: z.string().default("None"),
});

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditMode = !!id;
  const { settings } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  const [showSlipDialog, setShowSlipDialog] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: { 
      department: "ناظرہ", admissionFee: 0, monthlyFee: 0, section: "A",
      discountAmount: 0, installmentPlan: "None"
    }
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await apiClient.get('/classes');
        setClasses(res.data.data);
      } catch (error) {
        toast.error('کلاسز لوڈ نہیں ہو سکیں');
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchStudent = async () => {
        setIsFetching(true);
        try {
          const res = await apiClient.get('/students');
          const student = res.data.data.find((s: any) => s._id === id);
          if (student) {
            reset({
              studentName: student.studentName,
              guardianName: student.guardianName,
              contactNumber: student.contactNumber,
              department: student.department,
              classId: student.classId?._id,
              section: student.section,
              monthlyFee: student.monthlyFee,
              admissionFee: student.admissionFee,
              discountAmount: student.discountAmount || 0,
              installmentPlan: student.installmentPlan || "None",
            });
          }
        } catch (error) {
          toast.error('طالب علم کا ڈیٹا لوڈ نہیں ہو سکا');
        } finally {
          setIsFetching(false);
        }
      };
      fetchStudent();
    }
  }, [id, isEditMode, reset]);

  const contactNumberValue = watch("contactNumber") || "";
  const selectedClassId = watch("classId");
  const admissionFee = Number(watch("admissionFee")) || 0;
  const discountAmount = Number(watch("discountAmount")) || 0;
  const remainingDigits = 11 - contactNumberValue.length;
  const netAdmissionFee = Math.max(0, admissionFee - discountAmount);

  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find(c => c._id === selectedClassId);
      if (selectedClass) {
        setValue('admissionFee', selectedClass.admissionFee);
        setValue('monthlyFee', selectedClass.monthlyFee);
      }
    }
  }, [selectedClassId, classes, setValue]);

  const onError = () => {
    toast.error("براہ کرم تمام خانے درست طریقے سے پر کریں!");
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await apiClient.put(`/students/${id}`, data);
        toast.success('طالب علم کی معلومات کامیابی سے اپڈیٹ ہو گئیں!');
        navigate('/students');
      } else {
        const response = await apiClient.post('/students', data);
        toast.success(`کامیابی! داخلہ نمبر ${response.data.data.admissionNumber} تفویض کر دیا گیا ہے۔`);
        setCreatedStudent(response.data.data);
        setShowSlipDialog(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'محفوظ نہیں ہو سکا');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSlipPDF = async () => {
    if (!slipRef.current || !createdStudent) return;
    setIsGeneratingPDF(true);
    const toastId = toast.loading("Professional PDF بن رہی ہے...");

    try {
      await generateGlobalPDF(
        slipRef.current, 
        `Admission-Slip-${createdStudent.admissionNumber}`, 
        'p'
      );
      toast.success("PDF کامیابی سے ڈاؤن لوڈ ہو گئی!", { id: toastId });
    } catch (error) {
      toast.error("PDF بنانے میں مسئلہ آیا", { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const currentClassObj = classes.find(c => c._id === selectedClassId);
  const availableSections = currentClassObj ? currentClassObj.sections : [];

  const getClassName = (classId: any) => {
    if (!classId) return 'N/A';
    if (typeof classId === 'object' && classId.className) return classId.className;
    const foundClass = classes.find(c => c._id === classId);
    return foundClass ? foundClass.className : 'N/A';
  };

  if (isFetching) return <div className="p-10 text-center text-xl">ڈیٹا لوڈ ہو رہا ہے...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 mt-4 md:mt-8">
      
      {/* 🔥 Back Button */}
      <Button variant="ghost" onClick={() => navigate('/students')} className="mb-4 text-gray-600 hover:text-emerald-700 -ml-4">
        <ArrowRight className="ml-2 h-5 w-5" /> واپس جائیں
      </Button>

      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
          {isEditMode ? <Save size={28} /> : <UserPlus size={28} />}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-900">
            {isEditMode ? 'طالب علم کی معلومات تبدیل کریں' : 'نیا داخلہ فارم'}
          </h2>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 md:space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-lg text-gray-700">نام طالب علم <span className="text-red-500">*</span></Label>
            <Input {...register("studentName")} placeholder="محمد احمد" className={`text-lg h-14 ${errors.studentName ? 'border-red-500' : ''}`} />
            {errors.studentName && <p className="text-red-500 text-sm">{errors.studentName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg text-gray-700">سرپرست کا نام <span className="text-red-500">*</span></Label>
            <Input {...register("guardianName")} placeholder="عبدالرحمن" className={`text-lg h-14 ${errors.guardianName ? 'border-red-500' : ''}`} />
            {errors.guardianName && <p className="text-red-500 text-sm">{errors.guardianName.message as string}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-lg text-gray-700">رابطہ نمبر <span className="text-red-500">*</span></Label>
              <span className={`text-sm font-mono font-bold ${remainingDigits === 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                {contactNumberValue.length}/11
              </span>
            </div>
            <Input type="tel" {...register("contactNumber")} dir="ltr" maxLength={11} className={`text-lg h-14 font-mono ${errors.contactNumber ? 'border-red-500' : ''}`} />
            {errors.contactNumber && <p className="text-red-500 text-sm">{errors.contactNumber.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg text-gray-700">شعبہ <span className="text-red-500">*</span></Label>
            <select {...register("department")} className="w-full border border-gray-300 rounded-md px-3 text-lg h-14 bg-white">
              <option value="قاعدہ">قاعدہ</option>
              <option value="ناظرہ">ناظرہ</option>
              <option value="حفظ">حفظ</option>
              <option value="تربیت حفظ">تربیت حفظ</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="space-y-2">
            <Label className="text-lg text-gray-700">کلاس منتخب کریں <span className="text-red-500">*</span></Label>
            <select {...register("classId")} className={`w-full border rounded-md px-3 text-lg h-14 bg-white ${errors.classId ? 'border-red-500' : ''}`}>
              <option value="">-- کلاس منتخب کریں --</option>
              {classes.map((cls) => <option key={cls._id} value={cls._id}>{cls.className}</option>)}
            </select>
            {errors.classId && <p className="text-red-500 text-sm">{errors.classId.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg text-gray-700">سیکشن <span className="text-red-500">*</span></Label>
            <select {...register("section")} disabled={!selectedClassId} className={`w-full border rounded-md px-3 text-lg h-14 bg-white ${!selectedClassId ? 'opacity-50' : ''}`}>
              <option value="">سیکشن</option>
              {availableSections.map((sec: string) => <option key={sec} value={sec}>{sec}</option>)}
            </select>
            {errors.section && <p className="text-red-500 text-sm">{errors.section.message as string}</p>}
          </div>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 space-y-4">
          <h3 className="text-xl font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-2">فیس کی تفصیلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-lg text-gray-700">داخلہ فیس (اصل)</Label>
              <Input type="number" {...register("admissionFee")} dir="ltr" className="text-lg h-14 font-mono bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label className="text-lg text-gray-700">رعایت / ڈسکاؤنٹ (روپے)</Label>
              <Input type="number" {...register("discountAmount")} dir="ltr" className="text-lg h-14 font-mono bg-white border-amber-300" />
            </div>
            <div className="space-y-2">
              <Label className="text-lg text-gray-700">قابلِ ادائیگی داخلہ فیس</Label>
              <div className="h-14 flex items-center px-4 bg-emerald-100 border border-emerald-300 rounded-md">
                <span className="text-xl font-bold text-emerald-800 font-mono">Rs. {netAdmissionFee}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-lg text-gray-700">ماہانہ فیس (روپے)</Label>
              <Input type="number" {...register("monthlyFee")} dir="ltr" className="text-lg h-14 font-mono bg-gray-100" readOnly />
            </div>
            <div className="space-y-2">
              <Label className="text-lg text-gray-700">ادائیگی کا طریقہ</Label>
              <select {...register("installmentPlan")} className="w-full border border-gray-300 rounded-md px-3 text-lg h-14 bg-white">
                <option value="None">پوری فیس (Full Payment)</option>
                <option value="2 Installments">2 اقساط (2 Installments)</option>
                <option value="3 Installments">3 اقساط (3 Installments)</option>
                <option value="Monthly">ماہانہ اقساط (Monthly)</option>
              </select>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl h-16 mt-6 rounded-xl shadow-lg">
          {isLoading ? <><Loader2 className="ml-3 h-6 w-6 animate-spin" /> محفوظ ہو رہا ہے...</> : (isEditMode ? "تبدیلیاں محفوظ کریں" : "داخلہ فارم جمع کریں")}
        </Button>
      </form>

      {/* PDF Modal */}
      <Dialog open={showSlipDialog} onOpenChange={(open) => { if(!open) navigate('/students'); }}>
        <DialogContent className="max-w-300 w-[95vw] h-[95vh] bg-gray-400 p-0 overflow-hidden border-0 flex flex-col" dir="ltr">
          <DialogHeader className="bg-emerald-700 p-4 shrink-0">
            <DialogTitle className="text-white text-xl text-center">داخلہ کامیاب - فیس کی رسید (A4 Preview)</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 md:p-8 overflow-auto flex-1 bg-gray-400 flex justify-center items-start">
            {createdStudent && (
              <div className="m-auto">
                <div 
                  ref={slipRef} 
                  dir="rtl"
                  className="bg-white text-black w-198.5 min-h-280.75 p-10 md:p-12 shadow-2xl shrink-0"
                  style={{ fontFamily: "'Arial', sans-serif", lineHeight: '1.8' }}
                >
                  <div className="text-center border-b-4 border-gray-800 pb-4 mb-6">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-wide" style={{ fontFamily: 'Arial' }}>
                      {settings?.madarsaName || 'MADARSA NAME'}
                    </h1>
                    <p className="text-gray-700 text-md">{settings?.address || 'Address'}</p>
                    <p className="text-gray-700 text-sm font-semibold" dir="ltr">Ph: {settings?.phone} | Email: {settings?.email}</p>
                    
                    <div className="mt-4 text-xl font-bold text-gray-800 border-2 border-gray-800 inline-block px-6 py-1">
                      ADMISSION RECEIPT / داخلہ فیس کی رسید
                    </div>
                  </div>

                  <div className="mb-8 border-2 border-gray-800 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-lg">
                      
                      <div className="flex items-end gap-2">
                        <span className="font-bold text-gray-800 whitespace-nowrap text-base">Name / نام:</span>
                        <span className="border-b-2 border-dotted border-gray-500 flex-1 text-center font-semibold text-gray-900">{createdStudent.studentName}</span>
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <span className="font-bold text-gray-800 whitespace-nowrap text-base">Admission No / داخلہ نمبر:</span>
                        <span className="border-b-2 border-dotted border-gray-500 flex-1 text-center font-semibold text-gray-900">{createdStudent.admissionNumber}</span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-bold text-gray-800 whitespace-nowrap text-base">Father / ولدیت:</span>
                        <span className="border-b-2 border-dotted border-gray-500 flex-1 text-center font-semibold text-gray-900">{createdStudent.guardianName}</span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-bold text-gray-800 whitespace-nowrap text-base">Date / تاریخ:</span>
                        <span className="border-b-2 border-dotted border-gray-500 flex-1 text-center font-semibold text-gray-900">{new Date().toLocaleDateString('en-GB')}</span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-bold text-gray-800 whitespace-nowrap text-base">Class / کلاس:</span>
                        <span className="border-b-2 border-dotted border-gray-500 flex-1 text-center font-semibold text-gray-900">
                          {getClassName(createdStudent.classId)} ({createdStudent.section})
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-bold text-gray-800 whitespace-nowrap text-base">Contact / رابطہ:</span>
                        <span className="border-b-2 border-dotted border-gray-500 flex-1 text-center font-semibold text-gray-900" dir="ltr">{createdStudent.contactNumber}</span>
                      </div>

                    </div>
                  </div>

                  <div className="mb-10">
                    <table className="w-full text-right border-collapse border-2 border-gray-800 text-lg table-fixed">
                      <thead>
                        <tr className="bg-gray-200 text-gray-900 border-b-2 border-gray-800">
                          <th className="p-3 font-bold border-l border-gray-800 w-3/5">Description / تفصیل</th>
                          <th className="p-3 font-bold text-center w-2/5">Amount (PKR) / رقم</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-800">
                          <td className="p-3 border-l border-gray-800">Admission Fee / داخلہ فیس</td>
                          <td className="p-3 text-center font-mono">{createdStudent.admissionFee}</td>
                        </tr>
                        
                        <tr className="border-b border-gray-800">
                          <td className="p-3 border-l border-gray-800 text-red-600">Discount / رعایت</td>
                          <td className="p-3 text-center font-mono text-red-600">- {createdStudent.discountAmount || 0}</td>
                        </tr>

                        <tr className="border-b border-gray-800">
                          <td className="p-3 border-l border-gray-800">Monthly Fee / ماہانہ فیس (پہلا مہینہ)</td>
                          <td className="p-3 text-center font-mono">{createdStudent.monthlyFee}</td>
                        </tr>

                        <tr className="bg-gray-100 border-b-2 border-gray-800">
                          <td className="p-4 border-l border-gray-800 font-bold text-xl">
                            Total Amount Received / کل وصول شدہ رقم
                            <span className="block text-sm font-normal text-gray-600 mt-1">
                              ({createdStudent.admissionFee} - {createdStudent.discountAmount || 0}) + {createdStudent.monthlyFee}
                            </span>
                          </td>
                          <td className="p-4 text-center font-extrabold text-2xl text-black">
                            {(Number(createdStudent.admissionFee) - Number(createdStudent.discountAmount || 0)) + Number(createdStudent.monthlyFee)}
                          </td>
                        </tr>
                        
                        <tr>
                          <td className="p-3 border-l border-gray-800 font-bold">Payment Plan / ادائیگی کا طریقہ</td>
                          <td className="p-3 text-center font-bold text-blue-700">
                            {createdStudent.installmentPlan === 'None' ? 'پوری فیس (Full Payment)' : createdStudent.installmentPlan}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between mt-24 pt-8 px-4">
                    <div className="text-center">
                      <div className="border-t-2 border-black w-56 pt-1 text-md font-bold">Parent/Guardian Signature</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-black w-56 pt-1 text-md font-bold">Authorized Signature & Stamp</div>
                    </div>
                  </div>

                  <div className="mt-12 pt-4 border-t border-gray-400 text-center text-xs text-gray-600 flex justify-between items-center">
                    <p>Printed: {new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
                    <p>Powered by <span className="font-bold text-gray-800">{settings?.footerText || 'Irfanz Solutions'}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t flex flex-col md:flex-row gap-3 justify-end items-center shrink-0">
            <Button variant="outline" onClick={() => navigate('/students')} className="text-lg w-full md:w-auto border-gray-300">
              بند کریں
            </Button>
            <Button onClick={downloadSlipPDF} disabled={isGeneratingPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg w-full md:w-auto">
              {isGeneratingPDF ? <Loader2 className="animate-spin ml-2" /> : <Download className="ml-2" />}
              PDF ڈاؤن لوڈ کریں
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}