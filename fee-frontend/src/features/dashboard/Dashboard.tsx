import { useState, useEffect } from 'react';
import { Users, Banknote, AlertCircle, TrendingUp, Filter, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('All');

  // 🔥 Progress Bar State
  const [progress, setProgress] = useState(0);

  // 1. Classes Fetch
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiClient.get('/classes');
      return res.data.data;
    }
  });
  const classes = classesData || [];

  // 2. Dashboard Stats Fetch
  const { data: statsData, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['dashboardStats', startDate, endDate, selectedClass],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/stats?startDate=${startDate}&endDate=${endDate}&classId=${selectedClass}`);
      return res.data.data;
    },
  });

  // 🔥 Fake Progress Bar Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isLoading || isFetching) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 150);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    
    return () => clearInterval(interval);
  }, [isLoading, isFetching]);

  useEffect(() => {
    if (isError) {
      toast.error((error as any)?.response?.data?.message || 'ڈیش بورڈ کا ڈیٹا لوڈ نہیں ہو سکا');
    }
  }, [isError, error]);

  const stats = statsData || { totalStudents: 0, totalCollected: 0, totalPending: 0 };
  const classWiseData = statsData?.classWiseData || [];

  const setToday = () => {
    setStartDate(today);
    setEndDate(today);
  };

  const setThisMonth = () => {
    setStartDate(firstDayOfMonth);
    setEndDate(today);
  };

  const getSelectedClassName = () => {
    if (selectedClass === 'All') return 'تمام کلاسز (All)';
    const cls = classes.find((c: any) => c._id === selectedClass);
    return cls ? cls.className : 'تمام کلاسز (All)';
  };

  const isGlobalLoading = isLoading || isFetching;

  return (
    <div className="relative min-h-[80vh]">
      
      {/* 🔥 TRANSPARENT GLASS LOADER OVERLAY */}
      {isGlobalLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-xl animate-in fade-in duration-300">
          {/* 🔥 Yahan min-w-[250px] ko min-w-62.5 kar diya gaya hai */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center min-w-62.5">
            <div className="relative w-24 h-24 flex items-center justify-center mb-4">
              
              {/* SVG Circle Progress */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                <circle 
                  cx="48" cy="48" r="44" 
                  stroke="#059669" strokeWidth="8" fill="none" 
                  strokeDasharray="276" 
                  strokeDashoffset={276 - (276 * progress) / 100}
                  className="transition-all duration-300 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-2xl font-bold text-emerald-700 font-mono">
                {progress}%
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">ڈیٹا حاصل کیا جا رہا ہے</h2>
            <p className="text-gray-500 text-sm text-center animate-pulse">برائے مہربانی انتظار کریں...</p>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT */}
      <div className={`space-y-6 transition-all duration-300 ${isGlobalLoading ? 'pointer-events-none' : ''}`}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
              <TrendingUp size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              ڈیش بورڈ
            </h2>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-end">
            
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-600 flex items-center gap-1">
                <Calendar size={14} /> شروع کی تاریخ
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-10 text-sm md:text-base" />
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-600 flex items-center gap-1">
                <Calendar size={14} /> آخری تاریخ
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-10 text-sm md:text-base" />
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-600 flex items-center gap-1">
                <Filter size={14} /> کلاس منتخب کریں
              </label>
              <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val || 'All')}>
                <SelectTrigger className="w-full h-10 border-gray-300 text-sm md:text-base">
                  <SelectValue placeholder="تمام کلاسز">
                    {getSelectedClassName()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="All">تمام کلاسز (All)</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls._id} value={cls._id}>{cls.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 md:col-span-2 flex gap-2 w-full mt-2 md:mt-0">
              <Button variant="outline" onClick={setToday} className="flex-1 text-xs md:text-sm h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                آج کا دن
              </Button>
              <Button variant="outline" onClick={setThisMonth} className="flex-1 text-xs md:text-sm h-10 border-blue-200 text-blue-700 hover:bg-blue-50">
                اس مہینے کا
              </Button>
            </div>

          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 font-semibold mb-1 text-sm md:text-base">کل طلباء</p>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 font-mono">{stats.totalStudents}</h3>
              </div>
              <div className="bg-blue-50 p-3 md:p-4 rounded-full text-blue-500">
                <Users size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-emerald-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 font-semibold mb-1 text-sm md:text-base">کل وصول شدہ فیس</p>
                <h3 className="text-2xl md:text-3xl font-bold text-emerald-600 font-mono">Rs. {stats.totalCollected}</h3>
              </div>
              <div className="bg-emerald-50 p-3 md:p-4 rounded-full text-emerald-500">
                <Banknote size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 font-semibold mb-1 text-sm md:text-base">بقایا فیس (Pending)</p>
                <h3 className="text-2xl md:text-3xl font-bold text-red-500 font-mono">Rs. {stats.totalPending}</h3>
              </div>
              <div className="bg-red-50 p-3 md:p-4 rounded-full text-red-500">
                <AlertCircle size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Class-wise Breakdown */}
        {classWiseData.length > 0 && (
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border mt-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">کلاس وائز وصولی (Class-wise Collection)</h3>
            <div className="space-y-4">
              {classWiseData.map((cls: any) => (
                <div key={cls._id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="w-full md:w-24 font-bold text-gray-700 text-sm md:text-base">{cls.className}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 md:h-4 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(cls.totalCollected / (stats.totalCollected || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-full md:w-24 text-left md:text-right font-mono font-bold text-emerald-700 text-sm md:text-base">
                    Rs. {cls.totalCollected}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}