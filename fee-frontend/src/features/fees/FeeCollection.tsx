import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ReceiptText, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import FeeReceipt from './FeeReceipt';

// 12 Months Array
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const currentDate = new Date();
const defaultMonth = MONTHS[currentDate.getMonth()];
const defaultYear = currentDate.getFullYear().toString();

const feeSchema = z.object({
  studentId: z.string().min(1, "طالب علم منتخب کریں"),
  amountPaid: z.coerce.number().min(1, "رقم درج کریں"),
  month: z.string().min(1, "مہینہ منتخب کریں"),
  year: z.string().min(4, "سال درج کریں"),
});

export default function FeeCollection() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // 🔥 Search aur Filter ke liye States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(feeSchema),
    defaultValues: { 
      month: defaultMonth, 
      year: defaultYear 
    }
  });

  // 1. Students fetch karein
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await apiClient.get('/students');
        setStudents(res.data.data);
      } catch (error) {
        toast.error('طلباء کی فہرست لوڈ نہیں ہو سکی');
      }
    };
    fetchStudents();
  }, []);

  // 🔥 Filter Logic: Search, Class aur Section ke mutabiq students filter karein
  const filteredStudents = useMemo(() => {
    return students.filter((std) => {
      // Search Text Match (Name, Admission No, Guardian Name)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        std.studentName?.toLowerCase().includes(searchLower) ||
        std.admissionNumber?.toLowerCase().includes(searchLower) ||
        std.guardianName?.toLowerCase().includes(searchLower);

      // Class Match
      const matchesClass = filterClass === 'All' || std.classId?.className === filterClass;
      
      // Section Match
      const matchesSection = filterSection === 'All' || std.section === filterSection;

      return matchesSearch && matchesClass && matchesSection;
    });
  }, [students, searchTerm, filterClass, filterSection]);

  // Dropdown ke liye unique classes nikalne ka logic
  const uniqueClasses = ['All', ...Array.from(new Set(students.map(s => s.classId?.className).filter(Boolean)))];

  const selectedId = watch("studentId");
  const amountPaid = Number(watch("amountPaid")) || 0;
  
  useEffect(() => {
    const std = students.find(s => s._id === selectedId);
    setSelectedStudent(std || null);
  }, [selectedId, students]);

  const currentBalance = selectedStudent ? (Number(selectedStudent.monthlyFee) - amountPaid) : 0;

  const onError = () => toast.error("براہ کرم تمام معلومات درست درج کریں!");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const dataToSend = {
        ...data,
        balance: currentBalance > 0 ? currentBalance : 0
      };
      
      const res = await apiClient.post('/payments', dataToSend);
      toast.success("فیس کامیابی سے وصول کر لی گئی ہے!");
      setReceiptData(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فیس محفوظ نہیں ہو سکی');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border-t-4 border-emerald-600">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <ReceiptText className="text-emerald-600" size={32} />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">فیس وصولی</h2>
        </div>

        {/* 🔥 SEARCH & FILTERS SECTION */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Box */}
            <div className="space-y-2 md:col-span-1">
              <Label className="text-sm text-gray-600">تلاش کریں (نام، داخلہ نمبر، ولدیت)</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="تلاش کریں..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 pr-10 bg-white"
                />
              </div>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">کلاس کے مطابق فلٹر</Label>
              <select 
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full border rounded-md px-3 h-11 bg-white outline-none"
              >
                {uniqueClasses.map((cls: any) => (
                  <option key={cls} value={cls}>{cls === 'All' ? 'تمام کلاسز (All)' : cls}</option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">سیکشن کے مطابق فلٹر</Label>
              <select 
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full border rounded-md px-3 h-11 bg-white outline-none"
              >
                <option value="All">تمام سیکشنز (All)</option>
                <option value="A">سیکشن A</option>
                <option value="B">سیکشن B</option>
                <option value="C">سیکشن C</option>
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtered Student Dropdown */}
            <div className="space-y-2">
              <Label className="text-lg">طالب علم منتخب کریں</Label>
              <select 
                {...register("studentId")} 
                className={`w-full border rounded-md px-3 text-lg h-14 bg-white outline-none ${errors.studentId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">-- منتخب کریں ({filteredStudents.length} طلباء ملے) --</option>
                {filteredStudents.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.admissionNumber} - {s.studentName} (ولدیت: {s.guardianName})
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="text-red-500 text-sm">{errors.studentId.message as string}</p>}
            </div>

            {/* Month & Year Dropdown */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-lg">مہینہ</Label>
                <select {...register("month")} className="w-full border rounded-md px-3 text-lg h-14 bg-white" dir="ltr">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-lg">سال</Label>
                <Input {...register("year")} className="text-lg h-14 bg-white" dir="ltr" />
              </div>
            </div>
          </div>

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-lg font-bold text-emerald-900">{selectedStudent.studentName}</p>
                  <p className="text-gray-600">کلاس: {selectedStudent.classId?.className || 'N/A'} (سیکشن: {selectedStudent.section})</p>
                </div>
                <div className="text-left" dir="ltr">
                  <p className="text-gray-600">ماہانہ فیس:</p>
                  <p className="text-xl font-bold text-emerald-700 font-mono">Rs. {selectedStudent.monthlyFee}</p>
                </div>
              </div>

              {amountPaid > 0 && currentBalance > 0 && (
                <div className="mt-4 bg-red-100 text-red-700 p-3 rounded-md flex items-center gap-2 border border-red-200">
                  <AlertCircle size={20} />
                  <span className="font-semibold">توجہ: آپ فیس سے کم رقم وصول کر رہے ہیں۔ باقی فیس: Rs. {currentBalance}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-lg">وصول شدہ رقم (روپے)</Label>
            <Input 
              type="number" 
              {...register("amountPaid")} 
              placeholder="مثلاً: 500"
              dir="ltr"
              className={`text-lg h-14 font-mono bg-white ${errors.amountPaid ? 'border-red-500' : ''}`} 
            />
            {errors.amountPaid && <p className="text-red-500 text-sm">{errors.amountPaid.message as string}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl h-14">
            {isLoading ? <Loader2 className="ml-2 animate-spin" /> : null}
            {isLoading ? "محفوظ ہو رہا ہے..." : "فیس وصول کریں اور پرچی بنائیں"}
          </Button>
        </form>
      </div>

      {/* Receipt Section */}
      {receiptData && selectedStudent && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border-t-4 border-blue-600 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">فیس کی پرچی تیار ہے</h3>
          <FeeReceipt student={selectedStudent} paymentData={receiptData} />
        </div>
      )}

    </div>
  );
}