'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

import { saveAsXLSX } from '../lib/ExcelUtils';

export default function Home() {
  const router = useRouter();
  const [uploadError, setUploadError] = useState(null);

  const handleDownloadTemplate = async () => {
    const templateData = [
      {
        question: "Question text here?",
        option1: "Option A",
        option2: "Option B",
        option3: "Option C",
        option4: "Option D",
        answer: "Option A",
        timeLimit: 10
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
            timeLimit: parseInt(normalizeRow.timelimit) || 10
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="z-10 flex flex-col items-center gap-6 bg-[#35A8BA] p-12 md:p-16 rounded-3xl shadow-lg max-w-2xl w-full mx-4"
      >
        <div className="bg-yellow-50 p-4 rounded-full mb-2">
          <Crown size={64} className="text-yellow-500" />
        </div>

        <h1 className="text-5xl font-black text-white tracking-tight text-center" style={{ fontFamily: 'monospace' }}>
          EduQuiz
        </h1>

        <p className="text-lg text-white text-center max-w-md leading-relaxed">
          A fast-paced multiplayer quiz game.<br />
          <span className="text-sm font-medium text-white mt-1 block">Up to 10 Players • Rapid Fire • Competitive</span>
        </p>

        <div className="w-full h-px bg-white my-4"></div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Upload Section */}
          <div className="col-span-full flex flex-col gap-2">
            <label className="flex items-center justify-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all group">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-blue-500" />
              </div>
              <div>
                <span className="font-semibold block text-sm">Upload Excel File</span>
                <span className="text-xs text-slate-400 block">.xlsx custom questions</span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadError && <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-1 rounded">{uploadError}</p>}
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all text-sm font-medium"
          >
            <Download size={16} />
            Download Template
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
            className="flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all text-sm font-medium"
          >
            <span className="">Reset Defaults</span>
          </button>
        </div>

        <button
          onClick={startGame}
          className="w-full mt-4 px-8 py-5 bg-slate-900 text-white text-lg font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          START NEW GAME
        </button>
      </motion.div>
    </div>
  );
}
