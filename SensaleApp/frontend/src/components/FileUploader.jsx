import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { apiClient } from "../App";

export default function FileUploader({ onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiClient.post("/api/sales/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess(true);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred uploading the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  const downloadTemplate = (e) => {
    e.stopPropagation();
    const headers = ["Date", "Product Category", "Product Name", "Sales Volume", "Unit Price", "Platform Source"];
    const sampleRow = ["2023-10-01", "Electronics", "Wireless Earbuds", "15", "99.00", "Instagram"];
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sensale_sales_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className={`relative w-full p-10 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all duration-500 ${
        dragActive ? "border-rose-400 bg-rose-50/80 shadow-inner scale-[1.02]" : "border-slate-200 hover:border-rose-300 hover:bg-slate-50/50 bg-white shadow-sm"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        ref={inputRef}
        type="file" 
        className="hidden" 
        accept=".csv"
        onChange={handleChange}
      />
      
      {loading ? (
        <div className="flex flex-col items-center py-8 text-rose-500">
           <Loader className="w-16 h-16 animate-spin mb-6 drop-shadow-md" />
           <p className="text-sm font-black tracking-widest uppercase text-slate-500">Analyzing Market Data...</p>
        </div>
      ) : success ? (
        <div className="flex flex-col items-center py-8 text-emerald-500">
           <CheckCircle className="w-16 h-16 mb-6 drop-shadow-md" />
           <p className="text-2xl font-black text-center text-slate-800 mb-3 tracking-tight">Upload Successful!</p>
           <p className="text-sm text-slate-500 font-bold">Your data has been processed.</p>
           <button onClick={(e) => { e.stopPropagation(); setSuccess(false); }} className="mt-8 text-sm text-rose-500 hover:text-rose-600 font-black uppercase tracking-widest border-2 border-rose-100 hover:border-rose-200 px-6 py-3 rounded-2xl bg-rose-50 transition-all shadow-sm">Upload Another File</button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 cursor-pointer text-center group w-full" onClick={triggerSelect}>
          <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-lg flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 group-hover:bg-rose-100 group-hover:text-rose-500 group-hover:border-rose-50 transition-all duration-300">
             <UploadCloud className="w-12 h-12 drop-shadow-sm" />
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight mb-2">Upload Sales Data</p>
          <p className="text-md text-slate-500 font-bold mb-6">Drag & drop your CSV file here, or click to browse.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-2 items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={downloadTemplate}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              Download Template
            </button>
            <div className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm border border-slate-200">
              Supports: Template, Shopee, TikTok
            </div>
          </div>
          {error && (
            <div className="mt-8 flex items-center text-sm text-rose-600 font-black bg-rose-50 px-6 py-4 rounded-2xl border-2 border-rose-100 shadow-sm">
               <AlertCircle className="w-6 h-6 mr-3" />
               {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
