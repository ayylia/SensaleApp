import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, AlertTriangle, Target, Cpu, CheckCircle, 
  UploadCloud, FileText, ArrowRight, MessageSquare, DollarSign, 
  Edit3, Eye, RotateCcw, Printer, Image as ImageIcon, Save, Award, Info
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Default content taken directly from Siti Nur Alia's FYP draft
const DEFAULT_POSTER_DATA = {
  title: "SENSALE: A CROSS-PLATFORM SALES ASSISTANT TOOL WITH INTELLIGENT DEMAND FORECASTING AND PRICE RECOMMENDATION",
  studentName: "SITI NUR ALIA BINTI FAIZUL ANUAR",
  studentId: "2023410642",
  studentCourse: "CS251 - Bachelor of Computer Science (Hons.) Netcentric Computing",
  studentEmail: "aliafaizul@gmail.com",
  supervisorName: "DR. WAHEED YASIN MOHAMMED ABDUL-WAHID",
  supervisorTitle: "Project Supervisor",
  supervisorFaculty: "Faculty of Computer and Mathematical Sciences, UiTM Shah Alam",
  
  background: "Setting optimal product prices on hyper-competitive e-commerce platforms like Shopee and TikTok Shop has become a survival challenge for micro-entrepreneurs. Most sellers lack access to analytical resources and rely primarily on conventional approaches, including competitor imitation and instinct-based guesswork. Sensale bridges this gap by delivering a mobile-friendly Progressive Web Application (PWA) that simplifies complex data science into actionable business advice, integrating multi-platform sales logs with intelligence models.",
  
  problemStatements: [
    {
      id: "prob1",
      title: "Intuitive Pricing Guesswork",
      desc: "Micro-sellers manually track sales histories and rely on instinctual pricing or competitor price-copying, resulting in sub-optimal pricing models and severely reduced profit margins.",
      icon: "AlertTriangle"
    },
    {
      id: "prob2",
      title: "Uncertain Demand Seasonality",
      desc: "Holiday spikes, paydays, and school festivals complicate pricing. Without accurate, product-level demand forecasting, sellers suffer from severe overstocking or stockouts.",
      icon: "TrendingUp"
    },
    {
      id: "prob3",
      title: "Fragmented Data Silos",
      desc: "Small sellers lack a centralized tool to combine, clean, and visualize transactions across Shopee, TikTok Shop, and Instagram, leading to blind, non-data-driven business operations.",
      icon: "Cpu"
    }
  ],
  
  objectives: [
    "To design a centralized mobile dashboard that visualizes multi-platform e-commerce sales records, allowing micro-sellers to easily monitor business performance.",
    "To develop an intelligent analytics engine utilizing the Holt-Winters algorithm for seasonal demand forecasting and Linear Regression for pricing recommendation.",
    "To evaluate the system's functional capabilities and model predictive accuracy using simulated e-commerce datasets under various operational scenarios."
  ],
  
  significance: [
    {
      id: "sig1",
      title: "Empowered Decision-Making",
      desc: "Replaces intuition with reliable mathematical floor price constraints and competitive pricing algorithms to safeguard margins."
    },
    {
      id: "sig2",
      title: "Inventory and Pricing Control",
      desc: "Anticipates seasonal surges (e.g. Hari Raya) allowing proactive stock adjustments and dynamic price increases to maximize profit."
    },
    {
      id: "sig3",
      title: "Democratized Data Science",
      desc: "Translates complex time-series graphs and statistics into clean, natural language advice through an AI Copilot for non-technical users."
    }
  ],

  resultsTesting: {
    hwMae: "4.82 units",
    lrR2: "0.912 (Strong Positive)",
    uatUsability: "94.5% Approval",
    uatNavigation: "92.0% Approval",
    uatResponsiveness: "96.5% Approval"
  },

  conclusion: "Sensale successfully resolves the analytical gaps faced by micro-online sellers. Evaluation shows that integrating a mobile-first dashboard with forecasting and pricing algorithms yields high predictive accuracy and excellent user approval. By translating complex figures into simple natural language guidance via an AI Copilot, Sensale achieves its core mission of democratizing data analytics, transforming raw sales files into a robust competitive advantage for Malaysian SMEs.",
  
  references: [
    "Fildes, R., Ma, S., & Kolassa, S. (2022). Retail forecasting: Research and practice. International Journal of Forecasting, 38(4), 1269-1291.",
    "Mediavilla, M., et al. (2022). Artificial intelligence in e-commerce forecasting. Journal of Supply Chain Management, 15(2), 88-102.",
    "Justy, T., & Kgakatsi, L. (2023). SME analytics adoption barriers in emerging markets. SME Research Quarterly, 29(1), 45-59."
  ]
};

// Simulated chart data for Holt-Winters Forecasting
const BASE_CHART_DATA = [
  { day: "Day 1", actual: 12, forecast: null },
  { day: "Day 2", actual: 15, forecast: null },
  { day: "Day 3", actual: 14, forecast: null },
  { day: "Day 4", actual: 18, forecast: null },
  { day: "Day 5", actual: 22, forecast: null },
  { day: "Day 6", actual: 20, forecast: null },
  { day: "Day 7", actual: 17, forecast: null },
  { day: "Day 8", actual: 19, forecast: null },
  { day: "Day 9", actual: 25, forecast: null },
  { day: "Day 10", actual: 28, forecast: null },
  { day: "Day 11", actual: null, forecast: 29 },
  { day: "Day 12", actual: null, forecast: 31 },
  { day: "Day 13", actual: null, forecast: 30 },
  { day: "Day 14", actual: null, forecast: 34 },
  { day: "Day 15", actual: null, forecast: 38 },
  { day: "Day 16", actual: null, forecast: 37 },
  { day: "Day 17", actual: null, forecast: 35 }
];

export default function Poster() {
  const [posterData, setPosterData] = useState(() => {
    const saved = localStorage.getItem("fyp_poster_data");
    return saved ? JSON.parse(saved) : DEFAULT_POSTER_DATA;
  });

  const [editMode, setEditMode] = useState(false);
  const [theme, setTheme] = useState("navy"); // navy, berry, teal, slate
  const [studentPhoto, setStudentPhoto] = useState(() => localStorage.getItem("fyp_poster_student_photo") || "");
  const [supervisorPhoto, setSupervisorPhoto] = useState(() => localStorage.getItem("fyp_poster_supervisor_photo") || "");

  // Live forecasting multiplier state
  const [multiplier, setMultiplier] = useState(1.0);
  const [activeEvent, setActiveEvent] = useState("Normal"); // Normal, Payday, Raya
  const [chartData, setChartData] = useState(BASE_CHART_DATA);

  // Live pricing calculator states
  const [cost, setCost] = useState(15.00);
  const [price, setPrice] = useState(25.00);
  const [compPrice, setCompPrice] = useState(24.00);

  // Live Copilot chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "Hi Alia! I'm your Sensale AI Copilot. Ask me anything about your shop's performance." }
  ]);
  const [chatQuery, setChatQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const studentInputRef = useRef(null);
  const supervisorInputRef = useRef(null);

  // Save edits to local storage
  const handleTextChange = (path, value) => {
    const updated = { ...posterData };
    if (path.includes(".")) {
      const [parent, child] = path.split(".");
      updated[parent][child] = value;
    } else {
      updated[path] = value;
    }
    setPosterData(updated);
    localStorage.setItem("fyp_poster_data", JSON.stringify(updated));
  };

  const handleArrayTextChange = (field, index, value) => {
    const updated = { ...posterData };
    updated[field][index] = value;
    setPosterData(updated);
    localStorage.setItem("fyp_poster_data", JSON.stringify(updated));
  };

  const handleProblemChange = (index, field, value) => {
    const updated = { ...posterData };
    updated.problemStatements[index][field] = value;
    setPosterData(updated);
    localStorage.setItem("fyp_poster_data", JSON.stringify(updated));
  };

  const handleSignificanceChange = (index, field, value) => {
    const updated = { ...posterData };
    updated.significance[index][field] = value;
    setPosterData(updated);
    localStorage.setItem("fyp_poster_data", JSON.stringify(updated));
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all poster content to the thesis defaults?")) {
      setPosterData(DEFAULT_POSTER_DATA);
      localStorage.setItem("fyp_poster_data", JSON.stringify(DEFAULT_POSTER_DATA));
      setStudentPhoto("");
      setSupervisorPhoto("");
      localStorage.removeItem("fyp_poster_student_photo");
      localStorage.removeItem("fyp_poster_supervisor_photo");
    }
  };

  const handlePhotoUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (target === "student") {
          setStudentPhoto(base64);
          localStorage.setItem("fyp_poster_student_photo", base64);
        } else {
          setSupervisorPhoto(base64);
          localStorage.setItem("fyp_poster_supervisor_photo", base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Adjust forecast based on selected event
  useEffect(() => {
    let mult = 1.0;
    if (activeEvent === "Payday") mult = 1.18;
    if (activeEvent === "Raya") mult = 1.38;
    setMultiplier(mult);

    const updated = BASE_CHART_DATA.map(item => {
      if (item.forecast !== null) {
        return { ...item, forecast: Math.round(item.forecast * mult) };
      }
      return item;
    });
    setChartData(updated);
  }, [activeEvent]);

  // Pricing calculator values
  const marginPercentage = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;
  
  let marginStatus = "Safe";
  let marginColor = "text-green-600 border-green-200 bg-green-50";
  let marginBadge = "bg-green-600";
  let marginAdvice = "Safe Margin. Your product protects floor costs and yields healthy returns.";

  if (price <= cost || marginPercentage < 10) {
    marginStatus = "Danger";
    marginColor = "text-red-600 border-red-200 bg-red-50";
    marginBadge = "bg-red-600";
    marginAdvice = "Danger: Unsustainable Margin! You risk operating at a net loss. Raise price or lower unit costs.";
  } else if (marginPercentage >= 10 && marginPercentage < 25) {
    marginStatus = "Warning";
    marginColor = "text-amber-600 border-amber-200 bg-amber-50";
    marginBadge = "bg-amber-600";
    marginAdvice = "Squeezed Margin! Vulnerable to transaction fees and returns. Watch competitor price moves.";
  }

  // Copilot simulated Q&A
  const executeCopilotQuery = (query) => {
    if (isTyping) return;
    setChatMessages(prev => [...prev, { sender: "user", text: query }]);
    setIsTyping(true);

    let answer = "";
    if (query.includes("trend")) {
      answer = `Based on Holt-Winters calculations on your Shopee history, sales are trending upwards (+8%). We predict a weekly demand of 231 units, spiking next Wednesday due to the mid-month payroll injection.`;
    } else if (query.includes("Raya")) {
      answer = `Applying the 1.38x Hari Raya multiplier to traditional demand patterns, your expected volume rises from 110 to 152 daily units. I recommend increasing pricing dynamically by 8% to capture high purchase intent while avoiding out-of-stock statuses.`;
    } else if (query.includes("margin")) {
      answer = `Your current price point of RM${price} vs RM${cost} unit cost returns a ${marginPercentage}% gross margin. Competitor is at RM${compPrice}. Since you are within 5% of their rate and maintain a safe margin, your placement remains highly competitive.`;
    } else {
      answer = `Processing query... Sensale's ML core suggests maintaining dynamic buffers. Make sure sales logs are fully uploaded for accurate cross-platform metrics!`;
    }

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: "bot", text: answer }]);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  // Color schemes dictionary mapping theme names to tailwind classes
  const themeClasses = {
    navy: {
      primary: "border-slate-800",
      accent: "text-slate-800",
      bgHeader: "bg-slate-900 text-white",
      cardHeader: "bg-slate-800 text-white",
      highlightText: "text-slate-800 font-bold",
      footerBg: "bg-slate-900 text-slate-100",
      accentBorder: "border-slate-800",
      iconColor: "text-slate-700"
    },
    berry: {
      primary: "border-pink-800",
      accent: "text-pink-800",
      bgHeader: "bg-pink-900 text-white",
      cardHeader: "bg-pink-900 text-white",
      highlightText: "text-pink-900 font-bold",
      footerBg: "bg-pink-950 text-pink-50",
      accentBorder: "border-pink-800",
      iconColor: "text-pink-700"
    },
    teal: {
      primary: "border-teal-800",
      accent: "text-teal-800",
      bgHeader: "bg-teal-900 text-white",
      cardHeader: "bg-teal-900 text-white",
      highlightText: "text-teal-900 font-bold",
      footerBg: "bg-teal-950 text-teal-50",
      accentBorder: "border-teal-800",
      iconColor: "text-teal-700"
    },
    slate: {
      primary: "border-neutral-700",
      accent: "text-neutral-900",
      bgHeader: "bg-neutral-800 text-white",
      cardHeader: "bg-neutral-800 text-white",
      highlightText: "text-neutral-900 font-bold",
      footerBg: "bg-neutral-900 text-neutral-100",
      accentBorder: "border-neutral-700",
      iconColor: "text-neutral-700"
    }
  };

  const selectedTheme = themeClasses[theme] || themeClasses.navy;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 font-sans select-none flex flex-col items-center">
      
      {/* Interactive Controls Toolbar (Hidden during Print) */}
      <div className="no-print w-full max-w-6xl bg-white border border-slate-200 rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Award className="text-pink-700 w-6 h-6 animate-bounce" />
          <h2 className="text-lg font-bold text-slate-800">FYP Exhibition Poster Builder</h2>
          <span className="bg-pink-100 text-pink-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">Rainwater Award Layout</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Theme:</span>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg p-1.5 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="navy">Academic Navy</option>
              <option value="berry">Sensale Berry</option>
              <option value="teal">Modern Teal</option>
              <option value="slate">Classic Charcoal</option>
            </select>
          </div>

          {/* Toggle Edit Mode */}
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              editMode 
                ? "bg-amber-100 text-amber-800 border-amber-300" 
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
          >
            {editMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {editMode ? "Exhibition View (Preview)" : "Edit Poster Text"}
          </button>

          {/* Reset */}
          <button 
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Original Text
          </button>

          {/* Print PDF */}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-pink-700 text-white font-semibold hover:bg-pink-800 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF (A1 Format)
          </button>
        </div>
      </div>

      {editMode && (
        <div className="no-print w-full max-w-6xl bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs mb-4 flex items-center gap-2 animate-pulse">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span><strong>Edit Mode Active:</strong> You can click on any text block on the poster to edit its contents directly. Click the avatar photo frames at the bottom to upload custom images. All edits are saved in your browser's local cache.</span>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          MAIN POSTER CONTAINER 
          Formatted to represent a standard A1/A0 portrait layout.
          ──────────────────────────────────────────────────────── */}
      <div className={`poster-container w-full max-w-[841px] min-h-[1189px] bg-white border-8 ${selectedTheme.primary} shadow-2xl p-8 flex flex-col justify-between transition-all duration-300 relative select-text`}>
        
        {/* PRINT CSS - Injecting print layout modifiers dynamically */}
        <style>{`
          @media print {
            body {
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .poster-container {
              border: none !important;
              box-shadow: none !important;
              width: 21cm !important;
              height: 29.7cm !important;
              max-width: 100% !important;
              max-height: 100% !important;
              padding: 0.5cm !important;
              margin: 0 !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
            .print-grid-layout {
              display: grid !important;
              grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
              gap: 0.25rem !important;
            }
            /* Hide chart controls and demo inputs on print if desired, or freeze current selections */
            .demo-controls-print-hidden {
              display: none !important;
            }
          }
        `}</style>

        {/* 1. Header Banner Block */}
        <div className="border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-center gap-4">
            {/* UiTM Logo Placeholder Graphic */}
            <div className="flex items-center gap-3">
              <svg width="60" height="70" viewBox="0 0 100 120" fill="none" className="flex-shrink-0 text-slate-800">
                <path d="M50 0L95 30V90L50 120L5 90V30L50 0Z" fill="#1e293b"/>
                <path d="M50 10L85 35V85L50 105L15 85V35L50 10L20 40H80L50 70L20 40Z" fill="#ffffff"/>
                <circle cx="50" cy="50" r="10" fill="#f43f5e"/>
              </svg>
              <div>
                <h3 className="text-sm font-extrabold tracking-wider text-slate-900">UNIVERSITI TEKNOLOGI MARA</h3>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Faculty of Computer & Mathematical Sciences</p>
                <p className="text-[10px] text-pink-700 font-bold uppercase">Netcentric Computing (CS251)</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest mb-1">FINAL YEAR PROJECT EXHBITON</span>
              <p className="text-xs font-semibold text-slate-500">CS251 FYP Exhibition Poster Award</p>
            </div>
          </div>

          {/* Project Title Header */}
          <div className="mt-4 text-center">
            {editMode ? (
              <textarea 
                value={posterData.title}
                onChange={(e) => handleTextChange("title", e.target.value)}
                className="w-full text-center text-xl font-extrabold text-slate-950 border border-amber-300 bg-amber-50 rounded p-1"
                rows={2}
              />
            ) : (
              <h1 className="text-xl md:text-2xl font-black text-slate-950 leading-tight uppercase tracking-tight">
                {posterData.title}
              </h1>
            )}
          </div>
        </div>

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow print-grid-layout">
          
          {/* COLUMN 1: Background, Problems, Objectives */}
          <div className="flex flex-col gap-6 md:col-span-1">
            
            {/* Box A: Project Background */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-2 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <Info className="w-4 h-4 text-pink-700" />
                Project Background
              </h2>
              {editMode ? (
                <textarea 
                  value={posterData.background}
                  onChange={(e) => handleTextChange("background", e.target.value)}
                  className="w-full text-xs text-slate-700 border border-amber-300 bg-amber-50 rounded p-1"
                  rows={6}
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {posterData.background}
                </p>
              )}
            </div>

            {/* Box B: Problem Statement */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50 flex-grow">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-3 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <AlertTriangle className="w-4 h-4 text-pink-700" />
                Problem Statement
              </h2>
              <div className="space-y-4">
                {posterData.problemStatements.map((prob, idx) => (
                  <div key={prob.id} className="flex gap-2">
                    <div className="mt-1 flex-shrink-0">
                      {idx === 0 && <DollarSign className="w-5 h-5 text-red-600 bg-red-100 p-1 rounded-full border border-red-300" />}
                      {idx === 1 && <TrendingUp className="w-5 h-5 text-red-600 bg-red-100 p-1 rounded-full border border-red-300" />}
                      {idx === 2 && <Cpu className="w-5 h-5 text-red-600 bg-red-100 p-1 rounded-full border border-red-300" />}
                    </div>
                    <div className="flex-grow">
                      {editMode ? (
                        <>
                          <input 
                            value={prob.title}
                            onChange={(e) => handleProblemChange(idx, "title", e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 border border-amber-300 bg-amber-50 rounded p-0.5 mb-0.5"
                          />
                          <textarea 
                            value={prob.desc}
                            onChange={(e) => handleProblemChange(idx, "desc", e.target.value)}
                            className="w-full text-[10px] text-slate-600 border border-amber-300 bg-amber-50 rounded p-0.5"
                            rows={3}
                          />
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">{prob.title}</h4>
                          <p className="text-[10.5px] text-slate-600 leading-normal">{prob.desc}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box C: Objectives */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-2 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <Target className="w-4 h-4 text-pink-700" />
                Project Objectives
              </h2>
              <ul className="space-y-2">
                {posterData.objectives.map((obj, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="flex-shrink-0 bg-slate-900 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    {editMode ? (
                      <textarea 
                        value={obj}
                        onChange={(e) => handleArrayTextChange("objectives", idx, e.target.value)}
                        className="w-full text-xs text-slate-700 border border-amber-300 bg-amber-50 rounded p-0.5"
                        rows={2}
                      />
                    ) : (
                      <p className="text-xs text-slate-700 leading-tight">{obj}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* COLUMN 2: Solution Architecture, How it works, Project Significance */}
          <div className="flex flex-col gap-6 md:col-span-1">
            
            {/* Box D: Solution Architecture */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-3 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <Cpu className="w-4 h-4 text-pink-700" />
                Solution Architecture
              </h2>
              
              {/* Clean custom SVG Diagram representing system architecture */}
              <div className="flex justify-center py-2 bg-white rounded border border-slate-200">
                <svg width="220" height="150" viewBox="0 0 220 150" fill="none" className="w-full max-w-[220px]">
                  {/* CSV Sources */}
                  <rect x="10" y="5" width="55" height="30" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="37" y="18" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="bold">Platform CSV</text>
                  <text x="37" y="27" textAnchor="middle" fill="#64748b" fontSize="6">(Shopee/TikTok)</text>
                  
                  {/* Arrow 1 */}
                  <path d="M65 20 H85" stroke="#475569" strokeWidth="1.5" strokeDasharray="3" markerEnd="url(#arrow)"/>
                  
                  {/* Mobile PWA */}
                  <rect x="85" y="5" width="55" height="30" rx="3" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                  <text x="112" y="18" textAnchor="middle" fill="#065f46" fontSize="8" fontWeight="bold">Mobile PWA</text>
                  <text x="112" y="27" textAnchor="middle" fill="#047857" fontSize="6">(React UI & Auth)</text>

                  {/* Arrow 2 */}
                  <path d="M112 35 V55" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow)"/>

                  {/* Firebase Hub */}
                  <rect x="85" y="55" width="55" height="30" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="112" y="68" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="bold">Firebase Cloud</text>
                  <text x="112" y="77" textAnchor="middle" fill="#b45309" fontSize="6">(Database/Store)</text>

                  {/* Arrow 3 (Bi-directional) */}
                  <path d="M140 70 H160" stroke="#475569" strokeWidth="1.5"/>
                  <path d="M112 85 V110" stroke="#475569" strokeWidth="1.5"/>
                  
                  {/* Analytics & LLM Block */}
                  <rect x="160" y="45" width="55" height="50" rx="3" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1.5" />
                  <text x="187" y="58" textAnchor="middle" fill="#831843" fontSize="8" fontWeight="bold">AI Copilot</text>
                  <text x="187" y="68" textAnchor="middle" fill="#db2777" fontSize="7">Gemini API</text>
                  <text x="187" y="78" textAnchor="middle" fill="#64748b" fontSize="6">Generates natural</text>
                  <text x="187" y="86" textAnchor="middle" fill="#64748b" fontSize="6">language advice</text>

                  {/* Algorithms Block */}
                  <rect x="65" y="110" width="95" height="35" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="112" y="122" textAnchor="middle" fill="#1e3a8a" fontSize="8" fontWeight="bold">ML Analytical Core</text>
                  <text x="112" y="131" textAnchor="middle" fill="#2563eb" fontSize="7">Holt-Winters & Linear Reg.</text>
                  <text x="112" y="139" textAnchor="middle" fill="#64748b" fontSize="6">(Forecasts & Price Calculator)</text>

                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 10 5 L 0 8 z" fill="#475569" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Box E: How The System Works */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-3 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <CheckCircle className="w-4 h-4 text-pink-700" />
                Methodology / System Flow
              </h2>
              
              {/* Horizontal Pipeline Steps */}
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded p-1.5">
                  <div className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">1</div>
                  <div>
                    <span className="font-extrabold uppercase text-slate-800">CSV Upload:</span> Seller drops platform export files.
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded p-1.5">
                  <div className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">2</div>
                  <div>
                    <span className="font-extrabold uppercase text-slate-800">Preprocessing:</span> Standardizes data logs into Firebase.
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded p-1.5">
                  <div className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">3</div>
                  <div>
                    <span className="font-extrabold uppercase text-slate-800">Demand Forecast:</span> Holt-Winters predicts units.
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded p-1.5">
                  <div className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">4</div>
                  <div>
                    <span className="font-extrabold uppercase text-slate-800">Pricing Strategy:</span> Linear regression recommendations.
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded p-1.5">
                  <div className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">5</div>
                  <div>
                    <span className="font-extrabold uppercase text-slate-800">AI Advisory:</span> Gemini API translates calculations into text.
                  </div>
                </div>
              </div>
            </div>

            {/* Box F: Project Significance */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50 flex-grow">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-3 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <CheckCircle className="w-4 h-4 text-pink-700" />
                Project Significance
              </h2>
              <div className="space-y-3">
                {posterData.significance.map((sig, idx) => (
                  <div key={sig.id} className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-pink-700 flex-shrink-0 mt-0.5" />
                    <div>
                      {editMode ? (
                        <>
                          <input 
                            value={sig.title}
                            onChange={(e) => handleSignificanceChange(idx, "title", e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 border border-amber-300 bg-amber-50 rounded p-0.5 mb-0.5"
                          />
                          <textarea 
                            value={sig.desc}
                            onChange={(e) => handleSignificanceChange(idx, "desc", e.target.value)}
                            className="w-full text-[10px] text-slate-600 border border-amber-300 bg-amber-50 rounded p-0.5"
                            rows={2}
                          />
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">{sig.title}</h4>
                          <p className="text-[10.5px] text-slate-600 leading-normal">{sig.desc}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUMN 3: Live Interactive Demos, Findings, Conclusions */}
          <div className="flex flex-col gap-6 md:col-span-1">
            
            {/* Box G: Live Demos (The Highlight of the Exhibition!) */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-900 text-white">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-pink-500">
                  <Cpu className="w-4 h-4 text-pink-500 animate-spin" />
                  Interactive Live Demo
                </h2>
                <span className="no-print bg-pink-900/50 text-pink-300 border border-pink-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">Try it!</span>
              </div>
              
              {/* Tabbed Interactive Demos */}
              <div className="space-y-4 text-xs">
                
                {/* 1. Forecasting multiplier simulator */}
                <div className="border border-slate-800 bg-slate-950 p-2.5 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold uppercase text-pink-400 text-[10px]">1. Holt-Winters Forecast</span>
                    <div className="no-print flex gap-1">
                      {["Normal", "Payday", "Raya"].map((evt) => (
                        <button
                          key={evt}
                          onClick={() => setActiveEvent(evt)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                            activeEvent === evt ? "bg-pink-700 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {evt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9.5px] text-slate-400 mb-2">
                    Current Event: <strong className="text-white uppercase">{activeEvent}</strong> (Multiplier: <strong className="text-pink-400">{multiplier}x</strong>)
                  </p>
                  
                  {/* Recharts chart (small version for poster card) */}
                  <div className="h-28 w-full bg-slate-900 rounded p-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis dataKey="day" hide />
                        <YAxis stroke="#475569" fontSize={8} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: '9px' }} />
                        <Line type="monotone" dataKey="actual" stroke="#ec4899" strokeWidth={1.5} dot={{ r: 1 }} connectNulls name="Actual Units" />
                        <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} connectNulls name="Forecast" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Linear Regression Calculator */}
                <div className="border border-slate-800 bg-slate-950 p-2.5 rounded">
                  <span className="block font-extrabold uppercase text-pink-400 text-[10px] mb-2">2. Pricing Strategy Calculator</span>
                  
                  <div className="no-print grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className="text-[9px] text-slate-400 block font-semibold">Cost (RM)</label>
                      <input 
                        type="number" 
                        value={cost} 
                        onChange={(e) => setCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-[10px] font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block font-semibold">Your Price (RM)</label>
                      <input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-[10px] font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block font-semibold">Comp. Price (RM)</label>
                      <input 
                        type="number" 
                        value={compPrice} 
                        onChange={(e) => setCompPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-[10px] font-bold"
                      />
                    </div>
                  </div>

                  <div className={`border rounded p-2 flex items-center justify-between ${marginColor}`}>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider block">Margin Status</span>
                      <strong className="text-xs font-black uppercase">{marginStatus} ({marginPercentage}%)</strong>
                    </div>
                    <span className={`${marginBadge} text-white font-bold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wide`}>
                      {marginStatus}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal mt-1 text-center font-semibold italic">
                    "{marginAdvice}"
                  </p>
                </div>

                {/* 3. AI Copilot conversational query */}
                <div className="border border-slate-800 bg-slate-950 p-2.5 rounded">
                  <span className="block font-extrabold uppercase text-pink-400 text-[10px] mb-2">3. AI Copilot Insights Simulator</span>
                  
                  {/* Chat bubbles container */}
                  <div className="h-20 bg-slate-900 rounded p-1.5 overflow-y-auto mb-2 space-y-1.5 flex flex-col justify-end">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`max-w-[85%] rounded p-1 text-[9px] leading-tight ${
                          msg.sender === "bot" 
                            ? "bg-slate-800 text-slate-200 self-start" 
                            : "bg-pink-900 text-pink-100 self-end"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="text-[9px] text-slate-500 italic animate-pulse">Copilot is explaining...</div>
                    )}
                  </div>

                  {/* Predefined prompt buttons */}
                  <div className="no-print flex flex-wrap gap-1">
                    <button 
                      onClick={() => executeCopilotQuery("Explain demand trend")}
                      className="bg-slate-800 hover:bg-slate-700 text-[8.5px] text-slate-300 font-bold px-1.5 py-0.5 rounded border border-slate-700"
                    >
                      Interpret Trends
                    </button>
                    <button 
                      onClick={() => executeCopilotQuery("Analyze Raya pricing strategy")}
                      className="bg-slate-800 hover:bg-slate-700 text-[8.5px] text-slate-300 font-bold px-1.5 py-0.5 rounded border border-slate-700"
                    >
                      Raya Multiplier Advice
                    </button>
                    <button 
                      onClick={() => executeCopilotQuery(`Evaluate margin for RM${price}`)}
                      className="bg-slate-800 hover:bg-slate-700 text-[8.5px] text-slate-300 font-bold px-1.5 py-0.5 rounded border border-slate-700"
                    >
                      Check Pricing Margin
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Box H: Results & Model Accuracy Evaluation */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-2 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <FileText className="w-4 h-4 text-pink-700" />
                Results & Evaluation
              </h2>
              
              {/* Table displaying UAT & Mathematical metrics */}
              <div className="overflow-x-auto text-[10.5px]">
                <table className="w-full text-left border-collapse border border-slate-300 bg-white">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="p-1.5 font-bold uppercase text-[9px] border-r border-slate-300">Evaluation Mode</th>
                      <th className="p-1.5 font-bold uppercase text-[9px] border-r border-slate-300">Target Metric</th>
                      <th className="p-1.5 font-bold uppercase text-[9px]">Achieved Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-1.5 font-semibold border-r border-slate-300 bg-slate-50">Holt-Winters</td>
                      <td className="p-1.5 border-r border-slate-300">MAE (Error)</td>
                      <td className="p-1.5 font-bold text-pink-700">{posterData.resultsTesting.hwMae}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-1.5 font-semibold border-r border-slate-300 bg-slate-50">Linear Regression</td>
                      <td className="p-1.5 border-r border-slate-300">R-squared (R²)</td>
                      <td className="p-1.5 font-bold text-pink-700">{posterData.resultsTesting.lrR2}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-1.5 font-semibold border-r border-slate-300 bg-slate-50">UAT: Usability</td>
                      <td className="p-1.5 border-r border-slate-300">Ease of Navigation</td>
                      <td className="p-1.5 font-bold text-pink-700">{posterData.resultsTesting.uatUsability}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-semibold border-r border-slate-300 bg-slate-50">UAT: Design</td>
                      <td className="p-1.5 border-r border-slate-300">Mobile Response</td>
                      <td className="p-1.5 font-bold text-pink-700">{posterData.resultsTesting.uatResponsiveness}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-2 text-justify leading-tight">
                *Accuracy evaluated using simulated Shopee and TikTok seller history datasets. UAT evaluated by 30 active micro-online retailers in Malaysia.
              </p>
            </div>

            {/* Box I: Conclusions */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50 flex-grow justify-end">
              <h2 className={`text-sm font-extrabold uppercase border-b-2 border-slate-900 pb-1 mb-2 tracking-wide flex items-center gap-1.5 ${selectedTheme.accent}`}>
                <CheckCircle className="w-4 h-4 text-pink-700" />
                Conclusions
              </h2>
              {editMode ? (
                <textarea 
                  value={posterData.conclusion}
                  onChange={(e) => handleTextChange("conclusion", e.target.value)}
                  className="w-full text-xs text-slate-700 border border-amber-300 bg-amber-50 rounded p-1"
                  rows={5}
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {posterData.conclusion}
                </p>
              )}
            </div>

          </div>

        </div>

        {/* 3. References List Section */}
        <div className="border-t-2 border-slate-300 pt-4 mt-6">
          <h4 className="text-[10px] font-extrabold uppercase text-slate-800 mb-1">References</h4>
          <ul className="space-y-0.5">
            {posterData.references.map((refStr, idx) => (
              <li key={idx} className="text-[8.5px] text-slate-500 leading-none">
                {editMode ? (
                  <input 
                    value={refStr}
                    onChange={(e) => handleArrayTextChange("references", idx, e.target.value)}
                    className="w-full text-[8.5px] text-slate-500 border border-amber-300 bg-amber-50 rounded p-0.5"
                  />
                ) : (
                  <span>[{idx+1}] {refStr}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ────────────────────────────────────────────────────────
            4. SOLID DARK FOOTER BANNER 
            Mimicking the student & supervisor layout of the rainwater poster.
            ──────────────────────────────────────────────────────── */}
        <div className={`mt-6 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 ${selectedTheme.footerBg}`}>
          
          {/* Student Profile */}
          <div className="flex items-center gap-3 w-full md:w-1/2">
            <div className="relative group flex-shrink-0 cursor-pointer">
              <input 
                type="file" 
                ref={studentInputRef} 
                onChange={(e) => handlePhotoUpload(e, "student")} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                onClick={() => studentInputRef.current.click()}
                className="w-14 h-14 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center overflow-hidden shadow-md relative"
              >
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
                {/* Upload Hover Indicator */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <UploadCloud className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-black uppercase text-pink-400 tracking-wider">STUDENT</span>
              {editMode ? (
                <>
                  <input 
                    value={posterData.studentName}
                    onChange={(e) => handleTextChange("studentName", e.target.value)}
                    className="block text-xs font-black bg-slate-800 text-white rounded p-0.5 border border-slate-700"
                  />
                  <input 
                    value={posterData.studentId}
                    onChange={(e) => handleTextChange("studentId", e.target.value)}
                    className="block text-[10px] bg-slate-800 text-slate-300 rounded p-0.5 border border-slate-700 mt-0.5"
                  />
                  <input 
                    value={posterData.studentCourse}
                    onChange={(e) => handleTextChange("studentCourse", e.target.value)}
                    className="block text-[9px] bg-slate-800 text-slate-300 rounded p-0.5 border border-slate-700 mt-0.5"
                  />
                </>
              ) : (
                <>
                  <h4 className="text-xs font-black uppercase tracking-tight">{posterData.studentName}</h4>
                  <p className="text-[10px] text-slate-300 font-semibold leading-tight">{posterData.studentId} • {posterData.studentCourse}</p>
                  <p className="text-[9px] text-slate-400">{posterData.studentEmail}</p>
                </>
              )}
            </div>
          </div>

          {/* Divider line for mobile views */}
          <div className="w-full h-px bg-slate-800 md:hidden"></div>

          {/* Supervisor Profile */}
          <div className="flex items-center gap-3 w-full md:w-1/2 md:justify-end md:text-right">
            <div className="md:order-1 order-2">
              <span className="text-[9px] font-black uppercase text-pink-400 tracking-wider">SUPERVISOR</span>
              {editMode ? (
                <>
                  <input 
                    value={posterData.supervisorName}
                    onChange={(e) => handleTextChange("supervisorName", e.target.value)}
                    className="block text-xs font-black bg-slate-800 text-white rounded p-0.5 border border-slate-700 text-right"
                  />
                  <input 
                    value={posterData.supervisorTitle}
                    onChange={(e) => handleTextChange("supervisorTitle", e.target.value)}
                    className="block text-[10px] bg-slate-800 text-slate-300 rounded p-0.5 border border-slate-700 text-right mt-0.5"
                  />
                  <input 
                    value={posterData.supervisorFaculty}
                    onChange={(e) => handleTextChange("supervisorFaculty", e.target.value)}
                    className="block text-[9px] bg-slate-800 text-slate-300 rounded p-0.5 border border-slate-700 text-right mt-0.5"
                  />
                </>
              ) : (
                <>
                  <h4 className="text-xs font-black uppercase tracking-tight">{posterData.supervisorName}</h4>
                  <p className="text-[10px] text-slate-300 font-semibold leading-tight">{posterData.supervisorTitle}</p>
                  <p className="text-[9px] text-slate-400">{posterData.supervisorFaculty}</p>
                </>
              )}
            </div>

            <div className="relative group flex-shrink-0 cursor-pointer md:order-2 order-1">
              <input 
                type="file" 
                ref={supervisorInputRef} 
                onChange={(e) => handlePhotoUpload(e, "supervisor")} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                onClick={() => supervisorInputRef.current.click()}
                className="w-14 h-14 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center overflow-hidden shadow-md relative"
              >
                {supervisorPhoto ? (
                  <img src={supervisorPhoto} alt="Supervisor" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
                {/* Upload Hover Indicator */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <UploadCloud className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
