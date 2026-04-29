"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  Upload,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Download,
  Briefcase,
  UserCheck,
  UserX,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// ------------------------------
// Mock Data & API Endpoints
// ------------------------------

// Replace with your actual Python FastAPI URLs
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper: call Python CV parser
async function parseCV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/parse-cv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("CV parsing failed");
  return res.json();
}

// Helper: call Python screening endpoint
async function screenCandidate(candidateProfile: any, jobRequirements: any) {
  const res = await fetch(`${API_BASE}/screen-candidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      candidate: candidateProfile,   // ✅ changed from candidateProfile
      job: jobRequirements           // ✅ changed from jobRequirements
    }),
  });
  if (!res.ok) throw new Error("Screening failed");
  return res.json();
}

// Helper: duplicate detection
async function checkDuplicates(candidate: any) {
  const res = await fetch(`${API_BASE}/check-duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(candidate),
  });
  if (!res.ok) throw new Error("Duplicate check failed");
  return res.json();
}

// ------------------------------
// Dashboard Stats (mock)
// ------------------------------
const fetchDashboardStats = async () => {
  // Simulate API call – replace with real data from your DB
  return {
    totalCandidates: 1247,
    newThisWeek: 89,
    pendingScreening: 23,
    interviewsScheduled: 14,
    avgMatchScore: 76,
    conversionRate: 32,
    activeJobs: 12,
    rejectedThisMonth: 45,
  };
};

// ------------------------------
// Main Component
// ------------------------------
export default function ATSDashboard() {
  // Theme state (if not using global provider)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // Scanner state
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Charts data
  const [sourceData, setSourceData] = useState([
    { name: "LinkedIn", value: 420 },
    { name: "Indeed", value: 380 },
    { name: "WhatsApp", value: 210 },
    { name: "Manual", value: 237 },
  ]);
  const [statusData, setStatusData] = useState([
    { name: "Applied", count: 340 },
    { name: "Screening", count: 210 },
    { name: "Interview", count: 98 },
    { name: "Training", count: 45 },
    { name: "Hired", count: 32 },
  ]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats().then((data) => {
      setStats(data);
      setLoadingStats(false);
    });
  }, []);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      root.classList.add("dark");
      setActualTheme("dark");
    } else {
      root.classList.remove("dark");
      setActualTheme("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  };

  const ThemeIcon = () => {
    if (theme === "system") return <Monitor className="w-5 h-5" />;
    return theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Analyze resume: call Python APIs
  const handleAnalyze = async () => {
    if (!file || !jobDesc.trim()) return;
    setAnalyzing(true);
    try {
      // 1. Parse CV
      const parsed = await parseCV(file);
      // 2. Screen against job description (we'll extract requirements from JD text)
      // In real app, you'd have a job ID and fetch requirements; here we mock
      const jobRequirements = {
        mustHaveSkills: ["React", "Node.js", "TypeScript"],
        minExperienceYears: 2,
        educationLevel: "Bachelor's",
        requiredLanguages: ["English"],
        locationPreference: "Remote",
        shiftAvailability: "Full-time",
      };
      const screening = await screenCandidate(parsed, jobRequirements);
      // 3. Duplicate check
      const duplicateCheck = await checkDuplicates({
        full_name: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
      });
      setResults({
        parsed,
        screening,
        duplicateCheck,
      });
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check if Python backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to render KPI cards
  const KPICard = ({ title, value, icon: Icon, trend, description }: any) => (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}% from last month
            </p>
          )}
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              ATS<span className="text-blue-600">Recruit</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ThemeIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard KPIs */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recruitment Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of hiring pipeline and resume analytics
          </p>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Candidates"
              value={stats.totalCandidates}
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
            <KPICard
              title="New This Week"
              value={stats.newThisWeek}
              icon={UserCheck}
              trend={{ value: 8, isPositive: true }}
            />
            <KPICard
              title="Pending Screening"
              value={stats.pendingScreening}
              icon={Clock}
              description="Awaiting review"
            />
            <KPICard
              title="Interviews Scheduled"
              value={stats.interviewsScheduled}
              icon={Calendar}
              trend={{ value: 5, isPositive: true }}
            />
            <KPICard
              title="Avg. Match Score"
              value={`${stats.avgMatchScore}%`}
              icon={TrendingUp}
              trend={{ value: 3, isPositive: true }}
            />
            <KPICard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              icon={BarChart3}
              trend={{ value: 2, isPositive: false }}
            />
            <KPICard
              title="Active Jobs"
              value={stats.activeJobs}
              icon={Briefcase}
            />
            <KPICard
              title="Rejected (MTD)"
              value={stats.rejectedThisMonth}
              icon={UserX}
              trend={{ value: 10, isPositive: false }}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Candidates by Source
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      if (percent === undefined) return name;
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }} outerRadius={80}
                    dataKey="value"
                  >
                    {sourceData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pipeline Funnel
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ATS Resume Scanner Section */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
          <div className="border-b border-gray-200 dark:border-dark-border px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI Resume Scanner
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Upload a resume and paste job description to get match score, missing keywords, and duplicate check.
            </p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* File Upload */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                  ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("resume-upload")?.click()}
              >
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Upload className="w-10 h-10 text-blue-500 mb-2" />
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {file ? file.name : "Click or drag to upload resume"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT (max 5MB)</p>
              </div>

              {/* Job Description */}
              <div className="flex flex-col h-full">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Description
                </label>
                <textarea
                  className="flex-1 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  rows={5}
                  placeholder="Paste the full job description here..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={!file || !jobDesc || analyzing}
                className={`px-6 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2
                  ${!file || !jobDesc || analyzing
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  }
                `}
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Scan Resume
                  </>
                )}
              </button>
            </div>

            {/* Analysis Results */}
            {results && !analyzing && (
              <div className="mt-8 space-y-6 animate-fade-in">
                {/* Score & Match */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke={results.screening.score >= 70 ? "#10b981" : results.screening.score >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 54}
                          strokeDashoffset={2 * Math.PI * 54 * (1 - results.screening.score / 100)}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                        <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-gray-900 dark:fill-white">
                          {results.screening.score}%
                        </text>
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {results.screening.eligible ? "Eligible Candidate" : "Not Eligible"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{results.screening.summary}</p>
                      {results.duplicateCheck.isDuplicate && (
                        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Duplicate candidate detected
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Matched Skills */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Matched Requirements
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {results.screening.matchedRequirements?.map((item: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 rounded-md text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Missing Skills */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Missing Requirements
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {results.screening.missingRequirements?.map((item: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300 rounded-md text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted Info */}
                <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Extracted Candidate Info</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Name:</span> {results.parsed.fullName || "N/A"}</div>
                    <div><span className="text-gray-500">Email:</span> {results.parsed.email || "N/A"}</div>
                    <div><span className="text-gray-500">Phone:</span> {results.parsed.phone || "N/A"}</div>
                    <div><span className="text-gray-500">Experience:</span> {results.parsed.experienceYears || "N/A"} years</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                "New application from LinkedIn: Sarah Johnson",
                "Resume parsed for John Doe (WhatsApp source)",
                "Duplicate candidate detected for Mike Lee",
                "Interview scheduled with Emily Chen",
                "Training week 1 evaluation pending for 3 tutors",
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-dark-border last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{activity}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Attention Required
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">• 23 candidates pending screening</li>
              <li className="flex items-center gap-2">• 14 interviews need feedback submission</li>
              <li className="flex items-center gap-2">• 5 duplicate candidates waiting for resolution</li>
              <li className="flex items-center gap-2">• Weekly report due in 2 days</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}