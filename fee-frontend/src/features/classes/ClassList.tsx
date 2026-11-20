import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🔥 React Query import kiya
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function ClassList() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔥 React Query for Instant Load
  const { data: classes = [], isLoading, isFetching } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/classes');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/classes/${deleteId}`);
      toast.success('کلاس کامیابی سے ڈیلیٹ ہو گئی');
      setDeleteId(null);
      
      // 🔥 Cache Refresh karein
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'ڈیلیٹ کرنے میں مسئلہ آیا');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          کلاسز اور فیس
          {/* 🔥 Background fetching indicator */}
          {isFetching && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
        </h2>
        <Link to="/classes/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-lg">
            <PlusCircle className="ml-2" size={20} /> نئی کلاس
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <Table className="min-w-175">
          <TableHeader className="bg-emerald-50">
            <TableRow>
              <TableHead className="text-right text-lg text-emerald-900">کلاس کا نام</TableHead>
              <TableHead className="text-right text-lg text-emerald-900">سیکشنز</TableHead>
              <TableHead className="text-right text-lg text-emerald-900">داخلہ فیس</TableHead>
              <TableHead className="text-right text-lg text-emerald-900">ماہانہ فیس</TableHead>
              <TableHead className="text-right text-lg text-emerald-900">ایکشنز</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 🔥 First Time Loading */}
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500 text-lg">
                  کوئی کلاس موجود نہیں ہے۔
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls: any) => (
                <TableRow key={cls._id} className="hover:bg-gray-50">
                  <TableCell className="font-bold text-lg">{cls.className}</TableCell>
                  <TableCell dir="ltr" className="text-right">{cls.sections.join(', ')}</TableCell>
                  <TableCell className="font-mono">{cls.admissionFee}</TableCell>
                  <TableCell className="font-mono">{cls.monthlyFee}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate(`/classes/edit/${cls._id}`)}
                        className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                        title="ایڈٹ کریں"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setDeleteId(cls._id)}
                        className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                        title="ڈیلیٹ کریں"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-white w-[92vw] max-w-100 rounded-3xl p-6 border-0 shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center justify-center gap-4">
            <div className="bg-red-50 p-4 rounded-full mb-2">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800 text-center w-full">
              کیا آپ واقعی ڈیلیٹ کرنا چاہتے ہیں؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-500 text-center leading-relaxed">
              یہ عمل واپس نہیں ہو سکتا۔ اس کلاس کا ریکارڈ ہمیشہ کے لیے ڈیلیٹ ہو جائے گا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-3 mt-8 sm:flex-col w-full">
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white text-lg h-14 w-full rounded-xl shadow-md">
              {isDeleting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> ڈیلیٹ ہو رہا ہے...</span> : "جی ہاں، ڈیلیٹ کریں"}
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