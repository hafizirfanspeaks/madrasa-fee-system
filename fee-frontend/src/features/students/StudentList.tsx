import { useState, useMemo, useRef } from 'react'; // 🔥 NAYA: useRef add kiya
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx'; // 🔥 NAYA: Excel library
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusCircle, Trash2, IdCard, Receipt, History, Search, 
  XCircle, Filter, ChevronDown, ChevronUp, AlertTriangle, Loader2, Pencil, FileUp // 🔥 NAYA: FileUp icon
} from 'lucide-react';
import { toast } from 'sonner';
import StudentIDCard from './StudentIDCard';
import StudentLedger from './StudentLedger';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { bulkImportStudentsApi } from './api'; // 🔥 NAYA: API import

export default function StudentList() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [ledgerStudent, setLedgerStudent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔥 NAYA: Excel Import States
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canRegister = user?.role === 'admin' || user?.permissions?.canRegisterStudent;
  const canDelete = user?.role === 'admin' || user?.permissions?.canDeleteStudent;
  const canCollectFee = user?.role === 'admin' || user?.permissions?.canCollectFee;

  const { data: students = [], isLoading, isFetching } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await apiClient.get('/students');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        student.admissionNumber?.toLowerCase().includes(searchLower) ||
        student.studentName?.toLowerCase().includes(searchLower) ||
        student.guardianName?.toLowerCase().includes(searchLower);

      const matchesClass = filterClass === 'All' || student.classId?.className === filterClass;
      const matchesSection = filterSection === 'All' || student.section === filterSection;

      return matchesSearch && matchesClass && matchesSection;
    });
  }, [students, searchTerm, filterClass, filterSection]);

  const uniqueClasses = ['All', ...Array.from(new Set(students.map((s: any) => s.classId?.className).filter(Boolean)))];

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/students/${deleteId}`);
      toast.success('طالب علم کا ریکارڈ کامیابی سے ڈیلیٹ کر دیا گیا ہے۔');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'ڈیلیٹ کرنے میں مسئلہ آیا');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('All');
    setFilterSection('All');
  };

  // 🔥 NAYA: Excel File Handling Function
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading("Excel file read ho rahi hai...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Excel ko JSON mein convert karein
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("Excel file khali hai.");
      }

      // Backend ko data bhejein
      const response = await bulkImportStudentsApi(jsonData);
      
      toast.success(response.message || "Data import ho gaya!", { id: toastId });
      
      if (response.errors && response.errors.length > 0) {
        console.log("Import Errors:", response.errors);
        toast.error(`${response.errors.length} rows fail ho gayin. Console check karein.`);
      }

      queryClient.invalidateQueries({ queryKey: ['students'] });

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Import fail ho gaya", { id: toastId });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 md:space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <h2 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            طلباء کی فہرست
            {isFetching && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
          </h2>
          
          {canRegister && (
            <div className="flex gap-2 w-full md:w-auto">
              {/* 🔥 NAYA: Excel Import Button */}
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                ref={fileInputRef} 
                onChange={handleExcelImport} 
                className="hidden" 
              />
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex-1 md:flex-none border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1 md:gap-2 text-sm md:text-lg py-2 md:py-5 px-3 md:px-6"
              >
                {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp size={18} className="md:w-5 md:h-5" />}
                Import Excel
              </Button>

              <Link to="/students/new" className="flex-1 md:flex-none">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1 md:gap-2 text-sm md:text-lg py-2 md:py-5 px-3 md:px-6">
                  <PlusCircle size={18} className="md:w-5 md:h-5" />
                  نیا داخلہ
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="داخلہ نمبر، نام یا ولدیت سے تلاش کریں..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pr-10 pl-3 py-2.5 text-sm md:text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:hidden flex items-center gap-1 h-11 px-3">
              <Filter size={18} />
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-2 mt-3 md:mt-3`}>
            <div className="w-full">
              <Select value={filterClass} onValueChange={(val) => setFilterClass(val || 'All')}>
                <SelectTrigger className="w-full h-11 bg-white"><SelectValue placeholder="تمام کلاسز" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {uniqueClasses.map((cls: any) => (
                    <SelectItem key={cls} value={cls}>{cls === 'All' ? 'تمام کلاسز' : cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Select value={filterSection} onValueChange={(val) => setFilterSection(val || 'All')}>
                <SelectTrigger className="w-full h-11 bg-white"><SelectValue placeholder="تمام سیکشنز" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">تمام سیکشنز</SelectItem>
                  <SelectItem value="A">سیکشن A</SelectItem>
                  <SelectItem value="B">سیکشن B</SelectItem>
                  <SelectItem value="C">سیکشن C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filterClass !== 'All' || filterSection !== 'All') && (
              <Button variant="outline" onClick={clearFilters} className="text-red-500 border-red-200 hover:bg-red-50 h-11 w-full md:w-auto">
                <XCircle size={18} className="ml-1" /> فلٹر ختم کریں
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-x-auto w-full">
          <Table className="min-w-175 md:min-w-full">
            <TableHeader className="bg-emerald-50">
              <TableRow>
                <TableHead className="text-right text-sm md:text-lg text-emerald-900 whitespace-nowrap">داخلہ نمبر</TableHead>
                <TableHead className="text-right text-sm md:text-lg text-emerald-900 whitespace-nowrap">نام</TableHead>
                <TableHead className="text-right text-sm md:text-lg text-emerald-900 whitespace-nowrap">کلاس</TableHead>
                <TableHead className="text-right text-sm md:text-lg text-emerald-900 whitespace-nowrap">رابطہ</TableHead>
                <TableHead className="text-right text-sm md:text-lg text-emerald-900 whitespace-nowrap">ایکشنز</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-500 text-lg py-10">کوئی ریکارڈ موجود نہیں ہے۔</TableCell></TableRow>
              ) : (
                filteredStudents.map((student: any) => (
                  <TableRow key={student._id} className="hover:bg-gray-50 transition">
                    <TableCell className="font-mono text-sm md:text-base whitespace-nowrap font-bold text-gray-700">{student.admissionNumber}</TableCell>
                    <TableCell className="text-sm md:text-base font-semibold whitespace-nowrap">{student.studentName}</TableCell>
                    <TableCell className="text-sm md:text-base whitespace-nowrap">
                      <span className="font-semibold">{student.classId?.className || 'N/A'}</span>
                      <span className="text-gray-500 text-[10px] md:text-xs block">سیکشن: {student.section}</span>
                    </TableCell>
                    <TableCell dir="ltr" className="text-right text-sm md:text-base whitespace-nowrap font-mono">{student.contactNumber}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 md:gap-2 justify-end">
                        
                        {canCollectFee && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => navigate('/fees')} className="h-8 w-8 md:h-10 md:w-10 hover:bg-emerald-50 border-emerald-200">
                                <Receipt className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>فیس وصول کریں</p></TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setLedgerStudent(student)} className="h-8 w-8 md:h-10 md:w-10 hover:bg-blue-50 border-blue-200">
                              <History className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>فیس ہسٹری</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setSelectedStudent(student)} className="h-8 w-8 md:h-10 md:w-10">
                              <IdCard className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>ID کارڈ دیکھیں</p></TooltipContent>
                        </Tooltip>

                        {canRegister && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => navigate(`/students/edit/${student._id}`)} className="h-8 w-8 md:h-10 md:w-10 hover:bg-amber-50 border-amber-200">
                                <Pencil className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>معلومات تبدیل کریں</p></TooltipContent>
                          </Tooltip>
                        )}

                        {canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => setDeleteId(student._id)} className="h-8 w-8 md:h-10 md:w-10 hover:bg-red-50 border-red-200">
                                <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>ڈیلیٹ کریں</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ID Card Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="sm:max-w-106.25 w-[90vw] bg-gray-50 flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-xl md:text-2xl text-emerald-800">طالب علم کا شناختی کارڈ</DialogTitle></DialogHeader>
            {selectedStudent && <div className="mt-2 md:mt-4 w-full"><StudentIDCard student={selectedStudent} /></div>}
          </DialogContent>
        </Dialog>

        {/* Ledger Dialog */}
        <Dialog open={!!ledgerStudent} onOpenChange={() => setLedgerStudent(null)}>
          <DialogContent className="sm:max-w-3xl w-[95vw] bg-white overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle className="text-xl md:text-2xl text-emerald-800 border-b pb-2">فیس ہسٹری: {ledgerStudent?.studentName}</DialogTitle></DialogHeader>
            {ledgerStudent && <div className="mt-4"><StudentLedger studentId={ledgerStudent._id} /></div>}
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-white w-[92vw] max-w-100 rounded-3xl p-6 border-0 shadow-2xl">
            <AlertDialogHeader className="flex flex-col items-center justify-center gap-4">
              <div className="bg-red-50 p-4 rounded-full mb-2"><AlertTriangle className="h-10 w-10 text-red-500" /></div>
              <AlertDialogTitle className="text-2xl font-bold text-gray-800 text-center w-full">کیا آپ واقعی ڈیلیٹ کرنا چاہتے ہیں؟</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-500 text-center leading-relaxed">
                یہ عمل واپس نہیں ہو سکتا۔ اس طالب علم کا سارا ریکارڈ اور فیس کی ہسٹری ہمیشہ کے لیے ڈیلیٹ ہو جائے گی۔
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col gap-3 mt-8 sm:flex-col w-full">
              <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white text-lg h-14 w-full rounded-xl shadow-md">
                {isDeleting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> ڈیلیٹ ہو رہا ہے...</span> : "جی ہاں، ڈیلیٹ کریں"}
              </AlertDialogAction>
              <AlertDialogCancel className="text-gray-600 border-gray-200 hover:bg-gray-50 text-lg h-14 w-full rounded-xl mt-0">منسوخ کریں</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}