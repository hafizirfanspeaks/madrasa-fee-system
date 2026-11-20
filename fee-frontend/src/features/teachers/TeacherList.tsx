import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🔥 React Query import kiya
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle, Trash2, CheckCircle2, XCircle, Pencil, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function TeacherList() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔥 React Query for Instant Load
  const { data: teachers = [], isLoading, isFetching } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/users/${deleteId}`);
      toast.success('اکاؤنٹ ڈیلیٹ ہو گیا');
      setDeleteId(null);
      
      // 🔥 Cache Refresh karein
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error) {
      toast.error('ڈیلیٹ کرنے میں مسئلہ آیا');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            اساتذہ (Teachers)
            {/* 🔥 Background fetching indicator */}
            {isFetching && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
          </h2>
          <Link to="/teachers/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-lg">
              <PlusCircle className="ml-2" size={20} /> نیا استاد
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          <Table className="min-w-175">
            <TableHeader className="bg-emerald-50">
              <TableRow>
                <TableHead className="text-right text-lg">نام</TableHead>
                <TableHead className="text-right text-lg">ای میل</TableHead>
                <TableHead className="text-right text-lg">فیس وصولی</TableHead>
                <TableHead className="text-right text-lg">داخلہ فارم</TableHead>
                <TableHead className="text-right text-lg">ایکشن</TableHead>
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
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">کوئی استاد موجود نہیں ہے۔</TableCell>
                </TableRow>
              ) : (
                teachers.map((t: any) => (
                  <TableRow key={t._id} className="hover:bg-gray-50">
                    <TableCell className="font-bold text-lg">{t.name}</TableCell>
                    <TableCell dir="ltr" className="text-right font-mono">{t.email}</TableCell>
                    <TableCell>
                      {t.permissions?.canCollectFee ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-gray-300" />}
                    </TableCell>
                    <TableCell>
                      {t.permissions?.canRegisterStudent ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-gray-300" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => navigate(`/teachers/edit/${t._id}`)} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                              <Pencil size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>ایڈٹ کریں</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setDeleteId(t._id)} className="text-red-600 border-red-200 hover:bg-red-50">
                              <Trash2 size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>ڈیلیٹ کریں</p></TooltipContent>
                        </Tooltip>
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
                کیا آپ اس استاد کا اکاؤنٹ ڈیلیٹ کرنا چاہتے ہیں؟
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-500 text-center leading-relaxed">
                یہ عمل واپس نہیں ہو سکتا۔ اس استاد کا سارا ریکارڈ ہمیشہ کے لیے ڈیلیٹ ہو جائے گا۔
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
    </TooltipProvider>
  );
}