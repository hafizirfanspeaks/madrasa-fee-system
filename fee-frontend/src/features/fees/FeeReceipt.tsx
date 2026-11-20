import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settings.store';
import { generateGlobalPDF } from '@/utils/PDFService'; // 🔥 Global PDF Import

interface Props {
  student: any;
  paymentData: any;
}

export default function FeeReceipt({ student, paymentData }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useSettingsStore();

  // Pakistan Standard Time (PKT)
  const pktDate = new Date(paymentData.paymentDate).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("فیس کی پرچی بن رہی ہے...");

    try {
      // 🔥 Global PDF Function Call
      await generateGlobalPDF(receiptRef.current, `Receipt-${student.admissionNumber}-${paymentData.receiptNo}`, 'p');
      toast.success('فیس کی پرچی ڈاؤن لوڈ ہو گئی!', { id: toastId });
    } catch (error) {
      toast.error('پرچی بنانے میں مسئلہ آیا۔', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Receipt Design */}
      <div ref={receiptRef} className="w-100 bg-white border-2 border-gray-300 p-6 rounded-xl shadow-lg">
        
        {/* Dynamic Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-emerald-800">{settings?.madarsaName || 'مدرسہ فیض القرآن'}</h2>
          <p className="text-sm text-gray-500">{settings?.address || 'پتہ یہاں لکھیں'}</p>
          <p className="text-lg font-bold mt-2 text-gray-700">فیس کی پرچی (Fee Receipt)</p>
        </div>

        {/* Info */}
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span className="text-gray-600">پرچی نمبر:</span>
            <span className="font-mono font-bold">{paymentData.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">تاریخ و وقت (PKT):</span>
            <span className="font-mono text-sm">{pktDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">داخلہ نمبر:</span>
            <span className="font-mono text-emerald-700">{student.admissionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">نام طالب علم:</span>
            <span className="font-semibold">{student.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">مہینہ:</span>
            <span className="font-semibold">{paymentData.month} {paymentData.year}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
          <p className="text-gray-600 mb-1">وصول شدہ رقم</p>
          <p className="text-3xl font-bold text-emerald-700 font-mono">Rs. {paymentData.amountPaid}</p>
        </div>

        {/* Balance */}
        {paymentData.balance > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-1">باقی فیس (Balance)</p>
            <p className="text-xl font-bold text-red-600 font-mono">Rs. {paymentData.balance}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center text-sm text-gray-500 pt-4 border-t border-dashed border-gray-300">
          <div className="flex justify-between w-full mb-2">
            <span>موصول کنندہ کے دستخط</span>
            <span>مدرسہ کی مہر</span>
          </div>
          <div className="text-xs w-full text-center mt-2">
            Contact: {settings?.phone} | {settings?.email}
          </div>
        </div>
      </div>

      <Button onClick={downloadPDF} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        {isGenerating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
        {isGenerating ? 'پرچی بن رہی ہے...' : 'پرچی ڈاؤن لوڈ کریں'}
      </Button>
    </div>
  );
}