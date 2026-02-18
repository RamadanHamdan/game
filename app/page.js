'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [uploadError, setUploadError] = useState(null);

  const handleDownloadTemplate = () => {
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
    XLSX.writeFile(wb, "quiz_template.xlsx");
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
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#35a8ba] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-900 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 flex flex-col items-center gap-8 glass-panel p-16 border-t border-white/20 shadow-2xl"
      >
        <Crown size={80} className="text-yellow-400 filter drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
        <h1 className="text-6xl font-black bg-clip-text text-white tracking-tighter" style={{ fontFamily: 'monospace' }}>
          EduQuiz
        </h1>
        <p className="text-xl opacity-80 max-w-md text-center">
          4/10 Players Games <br /> Answer fast to charge your battery!
        </p>

        {/* Excel Upload Section */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <label className="flex items-center gap-2 cursor-pointer bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/50 transition-colors">
            <Upload size={18} />
            <span className="text-sm font-semibold">Upload Questions (Excel)</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 cursor-pointer bg-green-600/20 hover:bg-green-600/40 text-green-300 px-4 py-2 rounded-lg border border-green-500/50 transition-colors"
        >
          <Download size={18} />
          <span className="text-sm font-semibold">Download Template</span>
        </button>

        <button
          onClick={() => {
            if (confirm("Reset to default questions? This will clear any uploaded file.")) {
              sessionStorage.removeItem('quizQuestions');
              setUploadError(null);
              alert("Questions reset to default.");
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 cursor-pointer bg-red-600/20 hover:bg-red-600/40 text-red-300 px-4 py-2 rounded-lg border border-red-500/50 transition-colors"
        >
          <span className="text-sm font-semibold">Reset to Default</span>
        </button>

        <button
          onClick={startGame}
          className="group relative px-12 py-4 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform overflow-hidden cursor-pointer"
        >
          START GAME
        </button>
      </motion.div>
    </div>
  );
}
