import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentLedger({ studentId }: { studentId: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/payments/student/${studentId}`);
      setPayments(res.data.data);
    } catch (error) {
      toast.error('ہسٹری لوڈ نہیں ہو سکی');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [studentId]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/payments/${deleteId}`);
      toast.success('رسید کا ریکارڈ ڈیلیٹ کر دیا گیا ہے!');
      setDeleteId(null);
      fetchLedger(); // History refresh karein
    } catch (error) {
      toast.error('ڈیلیٹ کرنے میں مسئلہ آیا');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

  if (payments.length === 0) {
    return <div className="text-center p-6 text-gray-500 text-lg">اس طالب علم کی کوئی فیس ریکارڈ نہیں ہے۔</div>;
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100">
          <p className="text-sm text-gray-600">کل جمع شدہ</p>
          <p className="text-xl font-bold text-emerald-700 font-mono">Rs. {totalPaid}</p>
        </div>
        <div className="flex-1 bg-red-50 p-3 rounded-lg text-center border border-red-100">
          <p className="text-sm text-gray-600">کل بقایا</p>
          <p className="text-xl font-bold text-red-600 font-mono">Rs. {totalPending}</p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-right">رسید نمبر</TableHead>
              <TableHead className="text-right">مہینہ</TableHead>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right text-emerald-700">جمع</TableHead>
              <TableHead className="text-right text-red-600">بقایا</TableHead>
              <TableHead className="text-center">ایکشن</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p._id}>
                <TableCell className="font-mono text-sm">{p.receiptNo}</TableCell>
                <TableCell>{p.month} {p.year}</TableCell>
                <TableCell className="font-mono text-sm">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</TableCell>
                <TableCell className="font-bold text-emerald-600 font-mono">{p.amountPaid}</TableCell>
                <TableCell className="font-bold text-red-500 font-mono">{p.balance > 0 ? p.balance : '-'}</TableCell>
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeleteId(p._id)} 
                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                    title="ریکارڈ ڈیلیٹ کریں"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 🔥 Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-white w-[92vw] max-w-100 rounded-3xl p-6 border-0 shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center justify-center gap-4">
            <div className="bg-red-50 p-4 rounded-full mb-2">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800 text-center w-full">
              کیا آپ یہ رسید ڈیلیٹ کرنا چاہتے ہیں؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-500 text-center leading-relaxed">
              یہ عمل واپس نہیں ہو سکتا۔ اس رسید کا ریکارڈ ہمیشہ کے لیے ڈیلیٹ ہو جائے گا اور طالب علم کی ہسٹری سے غائب ہو جائے گا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-3 mt-8 sm:flex-col w-full">
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700 text-white text-lg h-14 w-full rounded-xl shadow-md"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> ڈیلیٹ ہو رہا ہے...
                </span>
              ) : "جی ہاں، ڈیلیٹ کریں"}
            </AlertDialogAction>
            <AlertDialogCancel className="text-gray-600 border-gray-200 hover:bg-gray-50 text-lg h-14 w-full rounded-xl mt-0">
              منسوخ کریں
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}