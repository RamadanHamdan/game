'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Download, Upload, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

import { saveAsXLSX } from '../lib/ExcelUtils';

export default function Home() {
  const router = useRouter();
  const [uploadError, setUploadError] = useState(null);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Deteksi Capacitor (Android/iOS) di runtime
    setIsCapacitor(typeof window !== 'undefined' && window.Capacitor !== undefined);
  }, []);

  const handleDownloadTemplate = async () => {
    const templateData = [
      {
        question: "Question text here?",
        option1: "Option A",
        option2: "Option B",
        option3: "Option C",
        option4: "Option D",
        answer: "Option A",
        timeLimit: 5
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    await saveAsXLSX(wb, "quiz_template.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setUploadError("The file appears to be empty.");
          return;
        }

        const parsedQuestions = data.map((row, index) => {
          const normalizeRow = {};
          Object.keys(row).forEach(key => normalizeRow[key.toLowerCase().trim()] = row[key]);

          return {
            id: index + 1,
            question: normalizeRow.question || "Untitled Question",
            options: [
              normalizeRow.option1 || "",
              normalizeRow.option2 || "",
              normalizeRow.option3 || "",
              normalizeRow.option4 || ""
            ].filter(o => o !== ""),
            answer: normalizeRow.answer || "",
            timeLimit: parseInt(normalizeRow.timelimit) || 5
          };
        }).filter(q => q.question && q.options.length >= 2 && q.answer);

        if (parsedQuestions.length > 0) {
          // Save to sessionStorage to pass to /play route
          sessionStorage.setItem('quizQuestions', JSON.stringify(parsedQuestions));
          setUploadError(null);
          alert(`Successfully loaded ${parsedQuestions.length} questions! Ready to Start.`);
        } else {
          setUploadError("No valid questions found.");
        }
      } catch (error) {
        console.error("Error parsing Excel:", error);
        setUploadError("Failed to parse file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const startGame = () => {
    // Clear any previous session if no upload, or keep if uploaded
    // If user didn't upload specific questions, we might want to ensure session is clear
    // But if they just uploaded, we keep it.
    // Actually, let's logic: if they didn't upload, we clear session so it defaults to json
    // But we don't know if they uploaded THIS session or previous. 
    // Let's assume hitting START uses whatever is in session or default.
    // To be safe: if they didn't upload ANY file in this view logic, ideally we rely on what's there?
    // Let's just navigate. The GameContainer will prioritize session storage.
    router.push('/play');
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#35A8BA] bg-black/10 text-slate-900 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <motion.div
        className="z-10 flex flex-col items-center gap-3 bg-[#35A8BA] p-8 rounded-2xl shadow-lg max-w-xl w-full mx-4"
      >
        {/* Logo + Title Row */}
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 p-2.5 rounded-full">
            <Crown size={36} className="text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'monospace' }}>
              EduQuiz
            </h1>
            <p className="text-xs text-white/80 font-medium">Up to 10 Players • Rapid Fire • Competitive</p>
          </div>
        </div>

        <div className="w-full h-px bg-white/40 my-1"></div>

        {/* Upload */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="flex items-center justify-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all group">
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
              <Upload size={18} className="text-blue-500" />
            </div>
            <div>
              <span className="font-semibold block text-sm">Upload Excel File</span>
              <span className="text-xs text-slate-400 block">.xlsx custom questions</span>
            </div>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
          {uploadError && <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-1 rounded">{uploadError}</p>}
        </div>

        {/* Action buttons row — 3 col on web, 2 col on Android (no admin) */}
        <div className={`grid gap-2 w-full ${isCapacitor ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 text-slate-600 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all text-xs font-medium"
          >
            <Download size={14} />
            Download
          </button>

          <button
            onClick={() => {
              if (confirm("Reset to default questions?")) {
                sessionStorage.removeItem('quizQuestions');
                setUploadError(null);
                alert("Questions reset to default.");
                window.location.reload();
              }
            }}
            className="flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 text-slate-600 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all text-xs font-medium"
          >
            Reset Defaults
          </button>

          {!isCapacitor && (
            <a
              href="/admin/generate/"
              className="flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 text-slate-600 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all text-xs font-medium"
            >
              <ShieldCheck size={14} className="text-blue-500" />
              Admin
            </a>
          )}
        </div>

        {/* START button */}
        <button
          onClick={startGame}
          className="w-full px-8 py-4 bg-slate-900 text-white text-base font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          START NEW GAME
        </button>

        {/* Watermark — inside card so always visible */}
        <p className="text-white/100 text-[11px] font-semibold tracking-widest pt-1">hdeview.co.id</p>
      </motion.div>
    </div>
  );
}
