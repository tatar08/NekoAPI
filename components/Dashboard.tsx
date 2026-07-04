'use client';

import React, { useState, useEffect } from 'react';
import { useApiStore } from '@/store/useApiStore';
import Swal from 'sweetalert2';

interface DashboardStats {
  totalCollections: number;
  totalRequests: number;
  totalEnvironments: number;
  totalUsers: number;
}

interface RecentCollection {
  id: string;
  name: string;
  requestCount: number;
  createdAt: string;
}

interface DashboardProps {
  setActiveView: (view: 'workspace' | 'runner' | 'admin' | 'dashboard' | 'teams') => void;
}

interface Holiday {
  date: string;
  name: string;
  localName?: string;
}

const HOLIDAYS_2026: Record<string, Holiday[]> = {
  TH: [
    { date: '2026-01-01', name: "New Year's Day", localName: 'วันขึ้นปีใหม่' },
    { date: '2026-03-03', name: 'Makha Bucha Day', localName: 'วันมาฆบูชา' },
    { date: '2026-04-06', name: 'Chakri Memorial Day', localName: 'วันจักรี' },
    { date: '2026-04-13', name: 'Songkran Festival', localName: 'วันสงกรานต์' },
    { date: '2026-04-14', name: 'Songkran Festival', localName: 'วันสงกรานต์' },
    { date: '2026-04-15', name: 'Songkran Festival', localName: 'วันสงกรานต์' },
    { date: '2026-05-01', name: 'National Labour Day', localName: 'วันแรงงานแห่งชาติ' },
    { date: '2026-05-04', name: 'Coronation Day', localName: 'วันฉัตรมงคล' },
    { date: '2026-05-31', name: 'Visakha Bucha Day', localName: 'วันวิสาขบูชา' },
    { date: '2026-06-03', name: "Queen Suthida's Birthday", localName: 'วันเฉลิมพระชนมพรรษาพระราชินี' },
    { date: '2026-07-27', name: 'Asahna Bucha Day', localName: 'วันอาสาฬหบูชา' },
    { date: '2026-07-28', name: "King Vajiralongkorn's Birthday", localName: 'วันเฉลิมพระชนมพรรษา ร.10' },
    { date: '2026-08-12', name: "Mother's Day (Queen Sirikit's Birthday)", localName: 'วันแม่แห่งชาติ' },
    { date: '2026-10-13', name: "King Bhumibol Memorial Day", localName: 'วันคล้ายวันสวรรคต ร.9' },
    { date: '2026-10-23', name: 'Chulalongkorn Day', localName: 'วันปิยมหาราช' },
    { date: '2026-12-05', name: "Father's Day (King Bhumibol's Birthday)", localName: 'วันพ่อแห่งชาติ' },
    { date: '2026-12-10', name: 'Constitution Day', localName: 'วันรัฐธรรมนูญ' },
    { date: '2026-12-31', name: "New Year's Eve", localName: 'วันสิ้นปี' },
  ],
  ID: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-19', name: "Isra Mi'raj" },
    { date: '2026-02-17', name: "Chinese New Year" },
    { date: '2026-03-19', name: "Hari Raya Nyepi" },
    { date: '2026-04-03', name: "Good Friday" },
    { date: '2026-04-05', name: "Easter Sunday" },
    { date: '2026-04-20', name: "Hari Raya Idul Fitri" },
    { date: '2026-04-21', name: "Hari Raya Idul Fitri" },
    { date: '2026-05-01', name: "Labour Day" },
    { date: '2026-05-14', name: "Ascension Day of Jesus Christ" },
    { date: '2026-05-31', name: "Hari Raya Waisak" },
    { date: '2026-06-01', name: "Pancasila Day" },
    { date: '2026-06-27', name: "Hari Raya Idul Adha" },
    { date: '2026-07-17', name: "Islamic New Year" },
    { date: '2026-08-17', name: "Independence Day" },
    { date: '2026-09-26', name: "Prophet Muhammad's Birthday" },
    { date: '2026-12-25', name: "Christmas Day" },
  ],
  MY: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-17', name: "Chinese New Year" },
    { date: '2026-02-18', name: "Chinese New Year (Day 2)" },
    { date: '2026-03-31', name: "Nuzul Al-Quran" },
    { date: '2026-04-20', name: "Hari Raya Aidilfitri" },
    { date: '2026-04-21', name: "Hari Raya Aidilfitri (Day 2)" },
    { date: '2026-05-01', name: "Labour Day" },
    { date: '2026-05-31', name: "Wesak Day" },
    { date: '2026-06-01', name: "Agong's Birthday" },
    { date: '2026-06-27', name: "Hari Raya Aidiladha" },
    { date: '2026-07-16', name: "Awal Muharram (Islamic New Year)" },
    { date: '2026-08-31', name: "Merdeka Day (National Day)" },
    { date: '2026-09-16', name: "Malaysia Day" },
    { date: '2026-09-26', name: "Prophet Muhammad's Birthday" },
    { date: '2026-12-25', name: "Christmas Day" },
  ],
  PH: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-17', name: "Chinese New Year" },
    { date: '2026-02-25', name: "EDSA People Power Revolution Anniversary" },
    { date: '2026-04-02', name: "Maundy Thursday" },
    { date: '2026-04-03', name: "Good Friday" },
    { date: '2026-04-04', name: "Black Saturday" },
    { date: '2026-04-09', name: "Araw ng Kagitingan" },
    { date: '2026-05-01', name: "Labour Day" },
    { date: '2026-06-12', name: "Independence Day" },
    { date: '2026-07-27', name: "Iglesia ni Cristo Day" },
    { date: '2026-08-21', name: "Ninoy Aquino Day" },
    { date: '2026-08-31', name: "National Heroes Day" },
    { date: '2026-11-01', name: "All Saints' Day" },
    { date: '2026-11-02', name: "All Souls' Day" },
    { date: '2026-11-30', name: "Bonifacio Day" },
    { date: '2026-12-08', name: "Feast of the Immaculate Conception" },
    { date: '2026-12-25', name: "Christmas Day" },
    { date: '2026-12-30', name: "Rizal Day" },
    { date: '2026-12-31', name: "Last Day of the Year" },
  ],
  VN: [
    { date: '2026-01-01', name: "New Year's Day", localName: 'Tết Dương Lịch' },
    { date: '2026-02-16', name: "Vietnamese New Year (Tet Eve)", localName: 'Giao thừa Tết Nguyên Đán' },
    { date: '2026-02-17', name: "Vietnamese New Year (Tet Day 1)", localName: 'Mùng 1 Tết Nguyên Đán' },
    { date: '2026-02-18', name: "Vietnamese New Year (Tet Day 2)", localName: 'Mùng 2 Tết Nguyên Đán' },
    { date: '2026-02-19', name: "Vietnamese New Year (Tet Day 3)", localName: 'Mùng 3 Tết Nguyên Đán' },
    { date: '2026-04-26', name: "Hung Kings Commemoration Day", localName: 'Giỗ tổ Hùng Vương' },
    { date: '2026-04-30', name: "Reunification Day", localName: 'Ngày Giải Phóng Miền Nam' },
    { date: '2026-05-01', name: "International Labour Day", localName: 'Ngày Quốc tế Lao động' },
    { date: '2026-09-02', name: "Independence Day", localName: 'Ngày Quốc Khánh' },
  ],
  SG: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-17', name: "Chinese New Year" },
    { date: '2026-02-18', name: "Chinese New Year (Day 2)" },
    { date: '2026-04-03', name: "Good Friday" },
    { date: '2026-04-20', name: "Hari Raya Puasa" },
    { date: '2026-05-01', name: "Labour Day" },
    { date: '2026-05-31', name: "Vesak Day" },
    { date: '2026-06-27', name: "Hari Raya Haji" },
    { date: '2026-08-09', name: "National Day" },
    { date: '2026-11-08', name: "Deepavali" },
    { date: '2026-12-25', name: "Christmas Day" },
  ]
};

const getWeatherDetails = (code: number) => {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { label: 'Drizzle/Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snowy', icon: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Overcast', icon: '☁️' };
};

const METHOD_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  GET: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]' },
  POST: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]' },
  PUT: { bg: 'bg-amber-500/15', text: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]' },
  DELETE: { bg: 'bg-rose-500/15', text: 'text-rose-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.2)]' },
  PATCH: { bg: 'bg-purple-500/15', text: 'text-purple-400', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.2)]' },
};

export default function Dashboard({ setActiveView }: DashboardProps) {
  const { user, collections, environments, passedRunsCount, failedRunsCount, resetRunStats } = useApiStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [methodDist, setMethodDist] = useState<Record<string, number>>({});
  const [recentCols, setRecentCols] = useState<RecentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; icon: string; label: string; location: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [holidayCountry, setHolidayCountry] = useState<'TH' | 'ID' | 'MY' | 'PH' | 'SG' | 'VN'>('TH');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        let lat = 13.7563;
        let lon = 100.5018;
        let locName = 'Bangkok, TH';

        if (navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                lat = position.coords.latitude;
                lon = position.coords.longitude;
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const city = tz.split('/').pop()?.replace('_', ' ') || 'Local Area';
                locName = `${city}`;
                resolve();
              },
              () => {
                resolve();
              },
              { timeout: 3000 }
            );
          });
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (res.ok) {
          const data = await res.json();
          const curr = data.current_weather;
          const details = getWeatherDetails(curr.weathercode);
          if (active) {
            setWeather({
              temp: Math.round(curr.temperature),
              icon: details.icon,
              label: details.label,
              location: locName
            });
          }
        }
      } catch (err) {
        console.error('Failed to load weather:', err);
      } finally {
        if (active) setWeatherLoading(false);
      }
    };

    fetchWeather();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setMethodDist(data.methodDistribution || {});
          setRecentCols(data.recentCollections || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalMethodRequests = Object.values(methodDist).reduce((a, b) => a + b, 0);

  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');

  const TRAFFIC_DATA: Record<'day' | 'week' | 'month', { label: string; value: number }[]> = {
    day: [
      { label: '00:00', value: 12 },
      { label: '04:00', value: 8 },
      { label: '08:00', value: 45 },
      { label: '12:00', value: 85 },
      { label: '16:00', value: 64 },
      { label: '20:00', value: 38 },
      { label: '24:00', value: 25 },
    ],
    week: [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 190 },
      { label: 'Wed', value: 310 },
      { label: 'Thu', value: 240 },
      { label: 'Fri', value: 405 },
      { label: 'Sat', value: 150 },
      { label: 'Sun', value: 95 },
    ],
    month: [
      { label: 'Week 1', value: 840 },
      { label: 'Week 2', value: 1200 },
      { label: 'Week 3', value: 1850 },
      { label: 'Week 4', value: 1450 },
    ],
  };

  const scaleMultiplier = Math.max(1, Math.min(5, 1 + (passedRunsCount + failedRunsCount) * 0.05));

  const activePoints = TRAFFIC_DATA[timeframe].map(p => ({
    label: p.label,
    value: Math.round(p.value * scaleMultiplier),
  }));

  const maxVal = Math.max(...activePoints.map(p => p.value), 10);
  const svgWidth = 800;
  const svgHeight = 150;
  const chartPaddingX = 40;
  const chartPaddingY = 20;
  const chartWidth = svgWidth - chartPaddingX * 2;
  const chartHeight = svgHeight - chartPaddingY * 2;

  const points = activePoints.map((p, i) => {
    const x = chartPaddingX + (i / (activePoints.length - 1)) * chartWidth;
    const y = chartPaddingY + chartHeight - (p.value / maxVal) * chartHeight;
    return { x, y, label: p.label, value: p.value };
  });

  const linePath = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartPaddingY + chartHeight} L ${points[0].x} ${chartPaddingY + chartHeight} Z`
    : '';

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-3">
        <div className="spinner" />
        <span className="text-xs font-mono">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-sm text-gray-200 select-none pb-12 animate-fade-in">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-950/30 via-[#0e1017] to-indigo-950/20 p-6 rounded-2xl border border-white/[0.04] shadow-lg">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-500/5 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-500/5 blur-[60px] pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-wide flex items-center gap-3">
              <span>{greeting()}, {user?.username || 'User'} 🐱</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] text-violet-300 rounded-lg flex items-center gap-1.5 shadow-sm">
                <span>📅</span>
                <span>{currentTime.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </span>
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Welcome to your NekoAPI workspace dashboard. Here&apos;s an overview of your API testing activity.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-mono font-bold text-white/80 tabular-nums tracking-wider">
              {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
              user?.role === 'admin'
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Weather & Holidays Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
        {/* Weather Widget Card */}
        <div className="bg-[#0e1017] border border-white/[0.04] p-5 rounded-xl shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/5 blur-[30px] pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Live Weather</span>
              <span className="text-xs font-semibold text-gray-300 mt-1 flex items-center gap-1">
                <span>📍</span>
                <span className="truncate max-w-[150px]">{weatherLoading ? 'Detecting Location...' : weather?.location || 'Bangkok, TH'}</span>
              </span>
            </div>
            {weatherLoading ? (
              <div className="spinner w-4 h-4 border-2" />
            ) : (
              <span className="text-3xl" title={weather?.label}>{weather?.icon || '☁️'}</span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-gray-150 tabular-nums">
              {weatherLoading ? '--' : `${weather?.temp ?? 28}°C`}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {weatherLoading ? 'Fetching forecast...' : weather?.label || 'Overcast'}
            </span>
          </div>
        </div>

        {/* Holidays Widget Card */}
        <div className="bg-[#0e1017] border border-white/[0.04] p-5 rounded-xl shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-500/5 blur-[30px] pointer-events-none" />

          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Public Holidays</span>
              <span className="text-xs font-semibold text-gray-300 mt-1">
                📅 Holidays in {holidayCountry === 'TH' ? 'Thailand' : holidayCountry === 'ID' ? 'Indonesia' : holidayCountry === 'MY' ? 'Malaysia' : holidayCountry === 'PH' ? 'Philippines' : holidayCountry === 'SG' ? 'Singapore' : 'Vietnam'}
              </span>
            </div>

            {/* Country selector flag pills */}
            <div className="flex gap-1.5 bg-[#161822] p-0.5 rounded-lg border border-white/[0.06] shadow-sm select-none">
              {(['TH', 'ID', 'MY', 'PH', 'SG', 'VN'] as const).map((code) => {
                const flags = { TH: '🇹🇭', ID: '🇮🇩', MY: '🇲🇾', PH: '🇵🇭', SG: '🇸🇬', VN: '🇻🇳' };
                return (
                  <button
                    key={code}
                    onClick={() => setHolidayCountry(code)}
                    className={`px-1.5 py-0.5 rounded text-[11px] transition cursor-pointer hover:scale-110 active:scale-95 ${
                      holidayCountry === code 
                        ? 'bg-violet-600/30 border border-violet-500/40 shadow-sm' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                    title={code === 'TH' ? 'Thailand' : code === 'ID' ? 'Indonesia' : code === 'MY' ? 'Malaysia' : code === 'PH' ? 'Philippines' : 'Vietnam'}
                  >
                    {flags[code]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            {(() => {
              const currentMonthNum = currentTime.getMonth();
              const currentYearNum = currentTime.getFullYear();
              const countryHolidays = HOLIDAYS_2026[holidayCountry] || [];
              const currentMonthHolidays = countryHolidays.filter(h => {
                const hDate = new Date(h.date);
                return hDate.getMonth() === currentMonthNum && hDate.getFullYear() === currentYearNum;
              });
              const upcomingHolidays = countryHolidays.filter(h => {
                const hDate = new Date(h.date);
                return hDate >= new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
              });
              const nextHoliday = upcomingHolidays[0];

              if (currentMonthHolidays.length > 0) {
                return currentMonthHolidays.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.02]">
                    <span className="font-bold text-violet-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      {new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-gray-450 font-medium truncate max-w-[180px]" title={h.localName || h.name}>
                      {h.localName || h.name}
                    </span>
                  </div>
                ));
              }

              return (
                <div className="text-xs text-gray-500 italic py-1">
                  No holidays this month.
                  {nextHoliday && (
                    <div className="mt-1 text-[11px] text-gray-400 not-italic">
                      👉 Next: <span className="font-bold text-violet-300">{nextHoliday.localName || nextHoliday.name}</span> on {new Date(nextHoliday.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Interactive Usage Traffic Chart */}
      <div className="bg-[#0e1017] border border-white/[0.04] p-5 rounded-xl shadow-md flex flex-col gap-4 animate-fade-up">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Metrics Console</span>
            <h2 className="text-sm font-bold text-gray-200 mt-0.5 flex items-center gap-1.5">
              <span>📊</span>
              <span>API Request Traffic</span>
            </h2>
          </div>
          
          {/* Timeframe selector pills */}
          <div className="flex bg-[#161822] p-0.5 rounded-lg border border-white/[0.06]">
            {(['day', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition ${
                  timeframe === t
                    ? 'bg-violet-600/90 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 cursor-pointer'
                }`}
              >
                {t === 'day' ? 'Daily' : t === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart Canvas */}
        <div className="w-full h-[160px] bg-[#090a0f]/40 rounded-lg p-2 relative overflow-hidden border border-white/[0.02]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yVal = chartPaddingY + chartHeight * ratio;
              const gridLabel = Math.round(maxVal * (1 - ratio));
              return (
                <g key={i}>
                  <line 
                    x1={chartPaddingX} 
                    y1={yVal} 
                    x2={svgWidth - chartPaddingX} 
                    y2={yVal} 
                    stroke="rgba(255, 255, 255, 0.03)" 
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={chartPaddingX - 8} 
                    y={yVal + 3} 
                    fill="var(--text-disabled)" 
                    className="text-[8px] font-mono text-right" 
                    textAnchor="end"
                  >
                    {gridLabel}
                  </text>
                </g>
              );
            })}

            {/* Area under the line */}
            {areaPath && (
              <path d={areaPath} fill="url(#chart-area-grad)" />
            )}

            {/* Line Path */}
            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="var(--accent-primary)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
              />
            )}

            {/* Data Points */}
            {points.map((p, i) => (
              <g key={i} className="group/point">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  fill="#ffffff" 
                  stroke="var(--accent-primary)" 
                  strokeWidth="2"
                  className="transition duration-150 transform hover:scale-150 cursor-pointer"
                />
                {/* Tooltip on point hover */}
                <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <rect 
                    x={p.x - 24} 
                    y={p.y - 25} 
                    width="48" 
                    height="16" 
                    rx="4" 
                    fill="var(--bg-elevated)" 
                    stroke="var(--border-default)" 
                    strokeWidth="1"
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 14} 
                    fill="var(--text-primary)" 
                    className="text-[8px] font-bold font-mono" 
                    textAnchor="middle"
                  >
                    {p.value}
                  </text>
                </g>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.map((p, i) => (
              <text 
                key={i} 
                x={p.x} 
                y={svgHeight - 4} 
                fill="var(--text-muted)" 
                className="text-[8px] font-bold tracking-wider" 
                textAnchor="middle"
              >
                {p.label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Collections', value: stats?.totalCollections ?? collections.length, icon: '📁', color: 'from-violet-500/20 to-violet-600/5', accent: 'text-violet-400' },
          { label: 'API Requests', value: stats?.totalRequests ?? 0, icon: '🚀', color: 'from-blue-500/20 to-blue-600/5', accent: 'text-blue-400' },
          { label: 'Environments', value: stats?.totalEnvironments ?? environments.length, icon: '🌐', color: 'from-emerald-500/20 to-emerald-600/5', accent: 'text-emerald-400' },
          { label: 'Team Members', value: stats?.totalUsers ?? 0, icon: '👥', color: 'from-amber-500/20 to-amber-600/5', accent: 'text-amber-400', adminOnly: true },
        ].map((card) => {
          if (card.adminOnly && user?.role !== 'admin') return null;
          return (
            <div key={card.label} className={`relative overflow-hidden bg-gradient-to-br ${card.color} bg-[#0e1017] border border-white/[0.04] p-5 rounded-xl shadow-md group hover:border-white/[0.08] transition-all duration-300`}>
              <div className="absolute top-3 right-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 group-hover:scale-110 transform">
                {card.icon}
              </div>
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">{card.label}</span>
              <span className={`text-3xl font-black mt-1 block font-mono tabular-nums ${card.accent}`}>
                {card.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column - Quick Actions + Method Distribution */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002]">
              <span className="font-bold text-gray-300 text-xs">⚡ Quick Actions</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveView('workspace')}
                className="bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 hover:border-violet-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">📝</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-violet-300 transition-colors">Workspace</span>
              </button>
              <button
                onClick={() => setActiveView('runner')}
                className="bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">🏃</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-300 transition-colors">Bulk Runner</span>
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveView('admin')}
                  className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-200">🛡️</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-amber-300 transition-colors">Admin Panel</span>
                </button>
              )}
              <button
                className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
                onClick={async () => {
                  const { addCollection } = useApiStore.getState();
                  
                  const { value: colName } = await Swal.fire({
                    title: 'Create New Collection',
                    text: 'Please enter a name for your new collection:',
                    input: 'text',
                    inputPlaceholder: 'e.g. My API Collection',
                    showCancelButton: true,
                    background: '#0c0d14',
                    color: '#e2e8f0',
                    confirmButtonText: 'Create Collection',
                    customClass: {
                      popup: 'border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-2xl font-sans',
                      title: 'text-base font-bold text-white pt-4',
                      htmlContainer: 'text-xs text-gray-400 mt-2',
                      input: 'bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-4 py-2 text-white outline-none text-xs w-5/6 mx-auto',
                      confirmButton: 'px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
                      cancelButton: 'px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ml-3',
                    },
                    buttonsStyling: false,
                    inputValidator: (value) => {
                      if (!value.trim()) {
                        return 'Collection name cannot be empty!';
                      }
                      return null;
                    }
                  });

                  if (!colName || !colName.trim()) return;

                  Swal.fire({
                    title: 'Creating Collection...',
                    allowOutsideClick: false,
                    didOpen: () => {
                      Swal.showLoading();
                    }
                  });

                  try {
                    await addCollection(colName.trim());
                    setActiveView('workspace');
                    Swal.close();
                  } catch (err) {
                    Swal.close();
                    console.error(err);
                  }
                }}
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">➕</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-emerald-300 transition-colors">New Collection</span>
              </button>
            </div>
          </div>

          {/* Method Distribution */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002]">
              <span className="font-bold text-gray-300 text-xs">📊 HTTP Method Distribution</span>
            </div>
            <div className="p-5">
              {totalMethodRequests === 0 ? (
                <p className="text-gray-600 text-xs text-center py-6 italic">No requests created yet. Start by adding a collection!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(methodDist).sort(([,a], [,b]) => b - a).map(([method, count]) => {
                    const pct = Math.round((count / totalMethodRequests) * 100);
                    const colors = METHOD_COLORS[method] || { bg: 'bg-gray-500/15', text: 'text-gray-400', glow: '' };
                    return (
                      <div key={method} className="flex items-center gap-3">
                        <span className={`w-14 text-[10px] font-bold tracking-wider ${colors.text}`}>{method}</span>
                        <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bg} ${colors.glow} transition-all duration-700`}
                            style={{ width: `${pct}%`, background: method === 'GET' ? 'rgba(16,185,129,0.5)' : method === 'POST' ? 'rgba(59,130,246,0.5)' : method === 'PUT' ? 'rgba(245,158,11,0.5)' : method === 'DELETE' ? 'rgba(239,68,68,0.5)' : method === 'PATCH' ? 'rgba(168,85,247,0.5)' : 'rgba(107,114,128,0.5)' }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{count} <span className="text-gray-600">({pct}%)</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Environment */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002]">
              <span className="font-bold text-gray-300 text-xs">🌐 Active Environment</span>
            </div>
            <div className="p-5">
              {environments.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4 italic">No environments configured.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {environments.slice(0, 4).map((env) => (
                    <div key={env.id} className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.06] rounded-lg px-4 py-2.5 transition">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                        <span className="font-semibold text-gray-200 text-xs">{env.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{env.variables.length} vars</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Runner Statistics */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">🏃 Bulk Runner History</span>
              {(passedRunsCount > 0 || failedRunsCount > 0) && (
                <button 
                  onClick={() => resetRunStats()}
                  className="text-[9px] text-gray-500 hover:text-rose-400 transition font-medium cursor-pointer"
                >
                  Reset stats
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-md relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
                <div className="absolute top-3 right-3 text-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300">
                  ✅
                </div>
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Passed Runs</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono text-emerald-400 tabular-nums">
                    {passedRunsCount}
                  </span>
                  <span className="text-[10px] text-gray-500">runs</span>
                </div>
              </div>

              <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-md relative overflow-hidden group hover:border-rose-500/20 transition-all duration-300">
                <div className="absolute top-3 right-3 text-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300">
                  ❌
                </div>
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Failed Runs</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono text-rose-400 tabular-nums">
                    {failedRunsCount}
                  </span>
                  <span className="text-[10px] text-gray-500">runs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Collections + System Info */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Recent Collections */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002] flex justify-between items-center">
              <span className="font-bold text-gray-300 text-xs">📁 Recent Collections</span>
              <button
                onClick={() => setActiveView('workspace')}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium transition cursor-pointer"
              >
                View All →
              </button>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {recentCols.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-10 italic">No collections yet. Create your first one!</p>
              ) : (
                recentCols.map((col) => (
                  <div key={col.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.01] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm">
                        📁
                      </div>
                      <div>
                        <span className="font-semibold text-gray-200 text-xs block">{col.name}</span>
                        <span className="text-[9px] text-gray-500">{col.requestCount} request{col.requestCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono">
                      {new Date(col.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workspace Overview - mini cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-md">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-3">🔧 Workspace Health</span>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Database</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Auth System</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-gray-300 font-mono text-[10px]">PostgreSQL</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-md">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-3">ℹ️ System Info</span>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Version</span>
                  <span className="text-gray-300 font-mono text-[10px]">v0.1.0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Framework</span>
                  <span className="text-gray-300 font-mono text-[10px]">Next.js 16</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Your Role</span>
                  <span className={`font-bold text-[10px] ${user?.role === 'admin' ? 'text-violet-400' : 'text-emerald-400'}`}>
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Shortcuts */}
          <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/10 rounded-xl border border-violet-500/10 p-5 shadow-md">
            <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider block mb-3">💡 Tips & Shortcuts</span>
            <div className="grid grid-cols-1 gap-2">
              {[
                { tip: 'Use the Workspace view to create and manage API requests in collections.', icon: '📝' },
                { tip: 'The Bulk Runner lets you execute multiple requests at once for testing.', icon: '🏃' },
                { tip: 'Configure Environments to swap variable sets between dev, staging, and production.', icon: '🌐' },
                { tip: 'Admin users can manage team members and assign roles from the Admin Panel.', icon: '🛡️' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed">
                  <span className="text-sm mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
