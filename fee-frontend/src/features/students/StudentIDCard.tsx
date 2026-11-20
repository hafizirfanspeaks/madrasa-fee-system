import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settings.store';
import { generateGlobalPDF } from '@/utils/PDFService'; // 🔥 Global PDF Import

interface Props {
  student: any;
}

export default function StudentIDCard({ student }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useSettingsStore();

  const downloadPDF = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("ID کارڈ بن رہا ہے...");

    try {
      // 🔥 Global PDF Function Call
      await generateGlobalPDF(cardRef.current, `ID-Card-${student.studentName}`, 'p');
      toast.success('ID کارڈ کامیابی سے ڈاؤن لوڈ ہو گیا!', { id: toastId });
    } catch (error) {
      toast.error('PDF بنانے میں مسئلہ آیا۔', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ID Card Design */}
      <div ref={cardRef} className="w-87.5 bg-white border-4 border-emerald-700 rounded-xl overflow-hidden shadow-2xl relative">
        
        <div className="bg-emerald-700 text-white text-center py-3 px-2">
          <h2 className="text-xl font-bold">{settings?.madarsaName || 'مدرسہ فیض القرآن'}</h2>
          <p className="text-xs mt-1 truncate">{settings?.address || 'پتہ یہاں لکھیں'}</p>
          <p className="text-[10px] mt-1">شناختی کارڈ</p>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-emerald-600 flex items-center justify-center mb-4">
            <span className="text-3xl text-gray-500">تصویر</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{student.studentName}</h3>
          <p className="text-gray-600 mt-1">ولدیت: {student.guardianName}</p>
          
          <div className="w-full mt-6 space-y-2 text-right">
            <p className="text-sm"><strong>داخلہ نمبر:</strong> <span className="font-mono text-lg text-emerald-700">{student.admissionNumber}</span></p>
            <p className="text-sm"><strong>کلاس:</strong> {student.classId?.className} ({student.section})</p>
            <p className="text-sm"><strong>رابطہ:</strong> {student.contactNumber}</p>
          </div>
        </div>
        
        <div className="bg-emerald-100 text-center py-2 text-xs text-emerald-900 font-semibold">
          یہ کارڈ مدرسہ کی ملکیت ہے
        </div>
      </div>

      <Button onClick={downloadPDF} disabled={isGenerating} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {isGenerating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
        {isGenerating ? 'بن رہا ہے...' : 'ID کارڈ ڈاؤن لوڈ کریں'}
      </Button>
    </div>
  );
}