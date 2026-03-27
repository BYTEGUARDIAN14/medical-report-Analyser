import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiClipboard, FiServer, FiFileText, FiUpload, FiZap, FiCheckCircle, FiChevronRight, FiClock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import FileUploader from "../components/FileUploader";
import LoadingSpinner from "../components/LoadingSpinner";
import { analyzeText, getHealth, uploadFile } from "../api/api";
import Sidebar from "../components/Sidebar";

const SAMPLE_TEXT = `Patient: John Doe, Age 45
Hemoglobin: 8.2 g/dL (Low) - Normal: 13.5-17.5
Blood Glucose (Fasting): 210 mg/dL (High) - Normal: 70-100
Cholesterol: 240 mg/dL (Elevated) - Normal: <200
Blood Pressure: 145/92 mmHg (Elevated) - Normal: 120/80
Creatinine: 1.1 mg/dL (Normal)
Diagnosis: Type 2 Diabetes with early nephropathy. Anemia detected. Dyslipidemia noted.
Recommendation: Immediate dietary changes, insulin regulation, and follow-up in 2 weeks.`;

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "txt"];

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [retryAllowed, setRetryAllowed] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [serverState, setServerState] = useState({ status: "checking", modelsReady: false });
  const [recentItems, setRecentItems] = useState([]);
  const navigate = useNavigate();

  const validateFile = (file) => {
    if (!file) return "Please choose a file.";
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return "Unsupported format. Please upload PDF, JPG, PNG, or TXT.";
    }
    if (file.size === 0) return "The selected file is empty.";
    return "";
  };

  const handleFileSelection = (file) => {
    const validationError = validateFile(file);
    setSelectedFile(validationError ? null : file);
    setError(validationError);
    setRetryAllowed(false);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError("");
  };

  const getErrorMessage = (err) => {
    if (!err?.response) return "Could not connect to server";
    if (err.response.status === 504) return "Model inference timeout. Please retry.";
    return err.response.data?.error || "Unexpected error while processing report.";
  };

  const processText = async (text) => {
    const analysis = await analyzeText(text);
    const payload = {
      extractedText: text,
      summary: analysis.data.summary,
      simplified: analysis.data.simplified,
      alerts: analysis.data.alerts || [],
      createdAt: new Date().toISOString(),
    };
    const nextRecent = [payload, ...recentItems].slice(0, 5);
    localStorage.setItem("medical_recent_analyses", JSON.stringify(nextRecent));
    setRecentItems(nextRecent);
    navigate("/result", { state: payload });
  };

  const handleAnalyze = async () => {
    setError("");
    setRetryAllowed(false);
    if (!selectedFile) {
      setError("Please select a file before analyzing.");
      return;
    }
    try {
      setStatus("loading");
      const uploadResponse = await uploadFile(selectedFile);
      const extractedText = (uploadResponse.data?.text || "").trim();
      if (!extractedText) {
        setError("Extracted report text is empty.");
        setStatus("error");
        return;
      }
      await processText(extractedText);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      const message = getErrorMessage(err);
      setError(message);
      setRetryAllowed(message.includes("timeout"));
    }
  };

  const handleLoadSample = async () => {
    setStatus("loading");
    setError("");
    setRetryAllowed(false);
    try {
      await processText(SAMPLE_TEXT);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  };

  const handleAnalyzePastedText = async () => {
    const text = pastedText.trim();
    if (!text) {
      setError("Please enter medical text before analyzing.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await processText(text);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  };

  const quickStats = useMemo(() => {
    const charCount = pastedText.length;
    const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
    return { charCount, wordCount };
  }, [pastedText]);

  useEffect(() => {
    const stored = localStorage.getItem("medical_recent_analyses");
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch {
        setRecentItems([]);
      }
    }
  }, []);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await getHealth();
        const health = response.data || {};
        setServerState({
          status: health.status || "unknown",
          modelsReady: !!health.models_ready,
        });
      } catch {
        setServerState({ status: "offline", modelsReady: false });
      }
    };
    loadHealth();
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="flex min-h-screen bg-mesh overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-10 overflow-y-auto h-screen scrollbar-hide">
        <motion.div 
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-4xl font-heading font-bold text-medtext leading-tight">
                AI Diagnostic & <br/> <span className="text-medprimary-500">Analysis Center</span>
              </h2>
              <p className="mt-3 text-slate-500 max-w-lg">
                Upload your medical reports for instant intelligence, simplified terminology, and data-driven insights.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="glass px-5 py-3 rounded-2xl flex items-center gap-3 border-l-4 border-medprimary-500 card-hover">
                <div className="w-10 h-10 rounded-xl bg-medprimary-100 flex items-center justify-center text-medprimary-500">
                  <FiServer />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Server Status</p>
                  <p className="text-sm font-bold text-slate-600 capitalize">{serverState.status}</p>
                </div>
              </div>
              
              <div className={`glass px-5 py-3 rounded-2xl flex items-center gap-3 border-l-4 ${serverState.modelsReady ? 'border-medsuccess' : 'border-meddanger'} card-hover`}>
                <div className={`w-10 h-10 rounded-xl ${serverState.modelsReady ? 'bg-emerald-100 text-medsuccess' : 'bg-rose-100 text-meddanger'} flex items-center justify-center`}>
                  <FiZap />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Systems</p>
                  <p className="text-sm font-bold text-slate-600">{serverState.modelsReady ? "Online" : "Booting"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Left Column: Upload & Paste */}
            <div className="col-span-2 space-y-8">
              <section className="glass rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-medprimary-50 border-r-4 border-t-4 border-medprimary-50 rounded-bl-[5rem] translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500 opacity-20">
                  <FiUpload size={120} />
                </div>
                
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <FiFileText className="text-medprimary-500" />
                  Select Document
                </h3>
                
                <FileUploader
                  selectedFile={selectedFile}
                  onFileChange={handleFileSelection}
                  onFileDrop={handleFileSelection}
                  onSampleLoad={handleLoadSample}
                  onClearFile={handleClearFile}
                  error={error}
                />

                <div className="mt-8 flex items-center gap-4">
                  <button
                    type="button"
                    disabled={!selectedFile || status === "loading"}
                    onClick={handleAnalyze}
                    className="flex-1 relative group overflow-hidden bg-medprimary-500 text-white rounded-2xl py-4 font-bold shadow-xl shadow-medprimary-200 disabled:bg-slate-200 disabled:shadow-none transition-all duration-300 transform active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {status === "loading" ? <LoadingSpinner label="Processing Intelligence..." /> : (
                        <>
                          Analyze Document
                          <FiChevronRight />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-medprimary-600 to-medprimary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                  
                  {retryAllowed && (
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      className="px-6 py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-white hover:border-medprimary-300 hover:text-medprimary-500 transition-all"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </section>

              <section className="glass-dark rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-3">
                    <FiClipboard className="text-medprimary-500" />
                    Rapid Text Entry
                  </h3>
                  <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span className="bg-white/50 px-3 py-1 rounded-full">{quickStats.wordCount} words</span>
                    <span className="bg-white/50 px-3 py-1 rounded-full">{quickStats.charCount} chars</span>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    value={pastedText}
                    onChange={(event) => setPastedText(event.target.value)}
                    rows={8}
                    placeholder="Paste your clinical notes or report results here for instant simplified analysis..."
                    className="w-full bg-white/30 backdrop-blur-sm rounded-3xl border-2 border-white/40 p-6 text-slate-700 outline-none focus:border-medprimary-300 focus:bg-white/50 transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4">
                    <button
                      type="button"
                      onClick={handleAnalyzePastedText}
                      disabled={status === "loading" || !pastedText.trim()}
                      className="bg-white px-5 py-2.5 rounded-2xl font-bold text-medprimary-500 shadow-sm hover:shadow-md hover:bg-medprimary-50 transition-all disabled:opacity-50"
                    >
                      Process Text
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: History & Stats */}
            <div className="space-y-8">
              <section className="glass rounded-[2.5rem] p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                  <FiClock className="text-medprimary-500" />
                  Recent Insights
                </h3>
                
                {recentItems.length > 0 ? (
                  <div className="space-y-4">
                    {recentItems.map((item, idx) => (
                      <motion.button
                        key={item.createdAt}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        type="button"
                        onClick={() => navigate("/result", { state: item })}
                        className="w-full group bg-white/40 p-4 rounded-3xl border border-white/60 text-left hover:bg-white hover:border-medprimary-200 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold text-medprimary-500 uppercase tracking-tighter">Diagnostic #{recentItems.length - idx}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <FiClock size={32} />
                    </div>
                    <p className="text-sm text-slate-400">No recent analyses found.<br/>Upload a report to begin.</p>
                  </div>
                )}
              </section>

              <section className="bg-gradient-to-br from-medprimary-500 to-sky-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-8 -translate-y-8 blur-2xl" />
                <h3 className="text-lg font-bold mb-4 flex items-center gap-3 relative z-10">
                  <FiCheckCircle />
                  Health Tip
                </h3>
                <p className="text-sm text-sky-50 leading-relaxed opacity-90 relative z-10">
                  Regular health checkups can identify potential issues early before they become serious. Your digital reports are secure and processed locally.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Global Status Error */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-[100] glass px-6 py-4 rounded-3xl border-l-8 border-meddanger flex items-center gap-4 text-meddanger shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">!</div>
            <p className="font-bold text-sm">{error}</p>
            <button onClick={() => setError("")} className="ml-4 text-slate-400 hover:text-slate-600 transition-colors">Close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPage;
