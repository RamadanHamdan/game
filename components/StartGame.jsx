'use client';

if (!gameStarted) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none" />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 flex flex-col items-center gap-8 glass-panel p-16 border-t border-white/20 shadow-2xl"
            >
                <Crown size={80} className="text-yellow-400 filter drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-400 to-blue-400 tracking-tighter" style={{ fontFamily: 'monospace' }}>
                    HDe Quiz
                </h1>
                <p className="text-xl opacity-80 max-w-md text-center">
                    4 Players Games <br /> Answer fast to charge your battery!
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
                    onClick={() => setGameStarted(true)}
                    className="group relative px-12 py-4 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform overflow-hidden"
                >
                    START GAME
                </button>
            </motion.div>
        </div>
    );
}