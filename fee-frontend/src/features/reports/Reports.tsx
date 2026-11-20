import { useState, useEffect, useRef, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Download, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentDate = new Date();
const defaultMonth = MONTHS[currentDate.getMonth()];
const defaultYear = currentDate.getFullYear().toString();

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'daily' | 'pending' | 'students'>('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  
  const tableRef = useRef<HTMLDivElement>(null);

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  const [pendingData, setPendingData] = useState<any[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingClass, setPendingClass] = useState('All');
  const [pendingMonth, setPendingMonth] = useState(defaultMonth);
  const [pendingYear, setPendingYear] = useState(defaultYear);

  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [studentClassFilter, setStudentClassFilter] = useState('All');
  const [studentSectionFilter, setStudentSectionFilter] = useState('All');

  const [waiveId, setWaiveId] = useState<string | null>(null);
  const [isWaiving, setIsWaiving] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await apiClient.get('/classes');
        setClasses(res.data.data);
      } catch (error) {
        console.error('Classes not loaded');
      }
    };
    fetchClasses();
  }, []);

  const fetchDaily = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/daily?date=${searchDate}`);
      setDailyData(res.data.data.payments);
      setDailyTotal(res.data.data.totalCollected);
    } catch (error) {
      toast.error('ڈیلی رپورٹ لوڈ نہیں ہو سکی');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/pending?classId=${pendingClass}&month=${pendingMonth}&year=${pendingYear}`);
      setPendingData(res.data.data.pendingPayments);
      setPendingTotal(res.data.data.totalPending);
    } catch (error) {
      toast.error('بقایا رپورٹ لوڈ نہیں ہو سکی');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/reports/students-data');
      setStudentsData(res.data.data);
    } catch (error) {
      toast.error('طلباء کا ڈیٹا لوڈ نہیں ہو سکا');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') fetchDaily();
    else if (activeTab === 'pending') fetchPending();
    else fetchStudentsData();
  }, [activeTab, pendingClass, pendingMonth, pendingYear]);

  const filteredStudentsData = useMemo(() => {
    return studentsData.filter(student => {
      const matchClass = studentClassFilter === 'All' || student.classId?._id === studentClassFilter;
      const matchSection = studentSectionFilter === 'All' || student.section === studentSectionFilter;
      return matchClass && matchSection;
    });
  }, [studentsData, studentClassFilter, studentSectionFilter]);

  const uniqueSections = ['All', ...Array.from(new Set(studentsData.map(s => s.section).filter(Boolean)))];

  const downloadCSV = (filename: string) => {
    let dataToExport: any[] = [];
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'daily') {
      dataToExport = dailyData;
      headers = ['Receipt No', 'Student Name', 'Admission No', 'Class', 'Month', 'Amount', 'Collected By'];
      rows = dataToExport.map(p => [p.receiptNo, p.studentId?.studentName, p.studentId?.admissionNumber, p.studentId?.classId?.className, `${p.month} ${p.year}`, p.amountPaid, p.collectedBy?.name || 'Admin']);
    } else if (activeTab === 'pending') {
      dataToExport = pendingData;
      headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Month', 'Paid', 'Balance'];
      rows = dataToExport.map(p => [p.studentId?.admissionNumber, p.studentId?.studentName, p.studentId?.classId?.className, p.studentId?.section, `${p.month} ${p.year}`, p.amountPaid, p.balance]);
    } else {
      dataToExport = filteredStudentsData;
      headers = ['Admission No', 'Student Name', 'Guardian Name', 'Class', 'Section', 'Contact'];
      rows = dataToExport.map(s => [s.admissionNumber, s.studentName, s.guardianName, s.classId?.className, s.section, s.contactNumber]);
    }

    if (dataToExport.length === 0) return toast.error('ڈاؤن لوڈ کے لیے ڈیٹا موجود نہیں');

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const getUrduTitle = () => {
    if (activeTab === 'daily') return "روزانہ وصولی رپورٹ";
    if (activeTab === 'pending') return "بقایا فیس رپورٹ";
    return "طلباء کا مکمل ڈیٹا رپورٹ";
  };

  // 🔥 PDF Generation Function
  const downloadPDF = async (fileName: string) => {
    const tableNode = tableRef.current;
    if (!tableNode) return;

    const toastId = toast.loading("PDF بن رہی ہے...");

    try {
      await document.fonts.ready;

      // Capture the ENTIRE HTML area (including the new header and footer)
      const imgData = await toPng(tableNode, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          padding: '20px',
        }
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add image starting from 0,0 since header is now part of the image
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`${fileName}.pdf`);
      toast.success("PDF ڈاؤن لوڈ ہو گئی!", { id: toastId });
    } catch (error: any) {
      console.error("PDF Error Details:", error);
      toast.error(`PDF مسئلہ: ` + (error.message || 'Unknown error'), { id: toastId });
    }
  };

  const confirmWaive = async () => {
    if (!waiveId) return;
    setIsWaiving(true);
    try {
      await apiClient.patch(`/payments/${waiveId}/waive`);
      toast.success('باقی فیس کامیابی سے معاف کر دی گئی ہے!');
      setWaiveId(null);
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'معاف کرنے میں مسئلہ آیا');
    } finally {
      setIsWaiving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      
      <div className="flex items-center gap-3 mb-2 md:mb-4">
        <div className="bg-emerald-100 p-2 md:p-3 rounded-full text-emerald-700">
          <FileText size={24} className="md:w-7 md:h-7" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">رپورٹس</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 border-b pb-2">
        <Button variant={activeTab === 'daily' ? 'default' : 'outline'} onClick={() => setActiveTab('daily')} className={`w-full text-xs md:text-lg h-12 ${activeTab === 'daily' ? 'bg-emerald-600' : ''}`}>
          روزانہ وصولی
        </Button>
        <Button variant={activeTab === 'pending' ? 'default' : 'outline'} onClick={() => setActiveTab('pending')} className={`w-full text-xs md:text-lg h-12 ${activeTab === 'pending' ? 'bg-red-600 hover:bg-red-700' : ''}`}>
          بقایا فیس
        </Button>
        <Button variant={activeTab === 'students' ? 'default' : 'outline'} onClick={() => setActiveTab('students')} className={`w-full text-xs md:text-lg h-12 ${activeTab === 'students' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
          طلباء کا ڈیٹا
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-75">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3 items-end md:items-center">
              {activeTab === 'daily' && (
                <div className="w-full md:w-auto space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">تاریخ منتخب کریں</label>
                  <Input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="w-full md:w-44 h-11" />
                </div>
              )}

              {activeTab === 'pending' && (
                <>
                  <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">کلاس</label>
                    <Select value={pendingClass} onValueChange={(val) => setPendingClass(val || 'All')}>
                      <SelectTrigger className="w-full h-11 border-gray-300">
                        <SelectValue placeholder="تمام کلاسز" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">تمام کلاسز</SelectItem>
                        {classes.map((cls) => <SelectItem key={cls._id} value={cls._id}>{cls.className}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-36 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">مہینہ</label>
                    <select value={pendingMonth} onChange={(e) => setPendingMonth(e.target.value)} className="w-full border rounded-md px-3 h-11 bg-white outline-none">
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-28 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">سال</label>
                    <Input value={pendingYear} onChange={(e) => setPendingYear(e.target.value)} className="h-11" />
                  </div>
                </>
              )}

              {activeTab === 'students' && (
                <>
                  <div className="w-full md:w-48 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">کلاس فلٹر</label>
                    <Select value={studentClassFilter} onValueChange={(val) => setStudentClassFilter(val || 'All')}>
                      <SelectTrigger className="w-full h-11 border-gray-300">
                        <SelectValue placeholder="تمام کلاسز" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">تمام کلاسز</SelectItem>
                        {classes.map((cls) => <SelectItem key={cls._id} value={cls._id}>{cls.className}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">سیکشن فلٹر</label>
                    <Select value={studentSectionFilter} onValueChange={(val) => setStudentSectionFilter(val || 'All')}>
                      <SelectTrigger className="w-full h-11 border-gray-300">
                        <SelectValue placeholder="تمام سیکشنز" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSections.map((sec: any) => (
                          <SelectItem key={sec} value={sec}>{sec === 'All' ? 'تمام سیکشنز' : sec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {activeTab !== 'students' && (
                <Button onClick={() => activeTab === 'daily' ? fetchDaily() : fetchPending()} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 h-11 px-6">
                  دیکھیں
                </Button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
              {activeTab === 'daily' && (
                <div className="w-full md:w-auto bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 h-11">
                  <span>کل وصولی: <span className="font-mono text-xl">{dailyTotal}</span></span>
                </div>
              )}
              {activeTab === 'pending' && (
                <div className="w-full md:w-auto bg-red-50 border border-red-200 text-red-800 px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 h-11">
                  <span>کل بقایا: <span className="font-mono text-xl">{pendingTotal}</span></span>
                </div>
              )}

              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={() => downloadCSV(`${activeTab}-report`)} className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 h-11 border border-gray-300">
                  <FileSpreadsheet size={18} className="ml-2" /> Excel
                </Button>
                <Button onClick={() => downloadPDF(`${activeTab}-report`)} className="flex-1 md:flex-none bg-blue-100 hover:bg-blue-200 text-blue-800 h-11 border border-blue-300">
                  <Download size={18} className="ml-2" /> PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Table Section (Header and Footer are now INSIDE this container) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8" ref={tableRef}>
            
            {/* 🔥 PDF Header (Institute Name & Address) */}
            <div className="text-center mb-8 border-b-2 border-emerald-600 pb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-2">مدرسہ فیض القرآن</h1>
              <p className="text-gray-600 text-sm md:text-base">1-K-3, Al Hasan Chowk, Nazimabad, No. 1</p>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-4 bg-gray-100 inline-block px-6 py-2 rounded-lg">
                {getUrduTitle()}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-175 md:min-w-full">
                
                <TableHeader className={activeTab === 'daily' ? 'bg-emerald-50' : activeTab === 'pending' ? 'bg-red-50' : 'bg-blue-50'}>
                  <TableRow>
                    {activeTab === 'daily' && (
                      <>
                        <TableHead className="text-center whitespace-nowrap font-bold text-emerald-900">رسید نمبر</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-emerald-900">طالب علم</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-emerald-900">کلاس</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-emerald-900">مہینہ</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-emerald-900">رقم</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-emerald-900">وصول کنندہ</TableHead>
                      </>
                    )}
                    {activeTab === 'pending' && (
                      <>
                        <TableHead className="text-center whitespace-nowrap font-bold text-red-900">داخلہ نمبر</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-red-900">طالب علم</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-red-900">کلاس</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-red-900">مہینہ</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-red-900">بقایا (Balance)</TableHead>
                        <TableHead className="text-center text-red-600 whitespace-nowrap font-bold">ایکشن</TableHead>
                      </>
                    )}
                    {activeTab === 'students' && (
                      <>
                        <TableHead className="text-center whitespace-nowrap font-bold text-blue-900">داخلہ نمبر</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-blue-900">نام طالب علم</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-blue-900">ولدیت</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-blue-900">کلاس</TableHead>
                        <TableHead className="text-center whitespace-nowrap font-bold text-blue-900">رابطہ</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeTab === 'daily' && dailyData.map((p) => (
                    <TableRow key={p._id} className="hover:bg-gray-50">
                      <TableCell className="text-center font-mono text-sm">{p.receiptNo}</TableCell>
                      <TableCell className="text-center font-semibold">{p.studentId?.studentName} <br/><span className="text-xs text-gray-500 font-mono">({p.studentId?.admissionNumber})</span></TableCell>
                      <TableCell className="text-center">{p.studentId?.classId?.className || 'N/A'}</TableCell>
                      <TableCell className="text-center">{p.month} {p.year}</TableCell>
                      <TableCell className="text-center font-mono text-emerald-600 font-bold">{p.amountPaid}</TableCell>
                      <TableCell className="text-center text-sm">{p.collectedBy?.name || 'Admin'}</TableCell>
                    </TableRow>
                  ))}

                  {activeTab === 'pending' && pendingData.map((p) => (
                    <TableRow key={p._id} className="hover:bg-gray-50">
                      <TableCell className="text-center font-mono text-sm">{p.studentId?.admissionNumber}</TableCell>
                      <TableCell className="text-center font-semibold">{p.studentId?.studentName}</TableCell>
                      <TableCell className="text-center">
                        {p.studentId?.classId?.className} 
                        <span className="text-xs text-gray-500 block">سیکشن: {p.studentId?.section}</span>
                      </TableCell>
                      <TableCell className="text-center">{p.month} {p.year}</TableCell>
                      <TableCell className="text-center font-mono text-red-600 font-bold text-lg">{p.balance}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => setWaiveId(p._id)} className="border-red-300 text-red-600 hover:bg-red-50">
                          <CheckCircle2 size={16} className="ml-1" /> معاف کریں
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {activeTab === 'students' && filteredStudentsData.map((s) => (
                    <TableRow key={s._id} className="hover:bg-gray-50">
                      <TableCell className="text-center font-mono text-sm font-bold text-gray-700">{s.admissionNumber}</TableCell>
                      <TableCell className="text-center font-semibold">{s.studentName}</TableCell>
                      <TableCell className="text-center">{s.guardianName}</TableCell>
                      <TableCell className="text-center">
                        {s.classId?.className} 
                        <span className="text-xs text-gray-500 block">سیکشن: {s.section}</span>
                      </TableCell>
                      <TableCell dir="ltr" className="text-center font-mono">{s.contactNumber}</TableCell>
                    </TableRow>
                  ))}

                  {((activeTab === 'daily' && dailyData.length === 0) || 
                    (activeTab === 'pending' && pendingData.length === 0) ||
                    (activeTab === 'students' && filteredStudentsData.length === 0)) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-500 text-lg">
                        کوئی ڈیٹا موجود نہیں ہے۔
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 🔥 PDF Footer (Irfanz Solutions & Date) */}
            <div className="mt-10 pt-4 border-t-2 border-gray-300 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-gray-500 gap-2">
              <div>Prepared by: <span className="font-bold text-gray-700">Irfanz Solutions</span></div>
              <div>Contact: <span className="font-bold text-gray-700" dir="ltr">IrfanzSolutions@gmail.com</span></div>
              <div dir="ltr">{new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} (PKT)</div>
            </div>

          </div>
        </div>
      )}

      {/* Waive Dialog */}
      <AlertDialog open={!!waiveId} onOpenChange={(open) => !open && setWaiveId(null)}>
        <AlertDialogContent className="bg-white w-[92vw] max-w-100 rounded-3xl p-6 border-0 shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center justify-center gap-4">
            <div className="bg-red-50 p-4 rounded-full mb-2"><XCircle className="h-10 w-10 text-red-500" /></div>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800 text-center w-full">کیا آپ فیس معاف کرنا چاہتے ہیں؟</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-500 text-center leading-relaxed">
              اس طالب علم کی باقی ماندہ فیس کو ہمیشہ کے لیے معاف کر دیا جائے گا اور بقایا فیس 0 ہو جائے گی۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-3 mt-8 sm:flex-col w-full">
            <AlertDialogAction onClick={confirmWaive} disabled={isWaiving} className="bg-red-600 hover:bg-red-700 text-white text-lg h-14 w-full rounded-xl shadow-md">
              {isWaiving ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> ہو رہا ہے...</span> : "جی ہاں، معاف کریں"}
            </AlertDialogAction>
            <AlertDialogCancel className="text-gray-600 border-gray-200 hover:bg-gray-50 text-lg h-14 w-full rounded-xl mt-0">منسوخ کریں</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}