import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheck, FiCopy, FiDownload, FiPrinter, FiSearch, FiGlobe, FiAlertCircle, FiActivity, FiFileText, FiInfo, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AlertBadge from "../components/AlertBadge";
import ResultCard from "../components/ResultCard";
import TextToSpeech from "../components/TextToSpeech";
import Sidebar from "../components/Sidebar";
import { translateText } from "../api/api";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExtracted, setShowExtracted] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLang, setTargetLang] = useState("Hindi");
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);

  const data = location.state;
  useEffect(() => {
    if (!data) {
      navigate("/", { replace: true });
    }
  }, [data, navigate]);

  if (!data) return null;

  const { extractedText, summary, simplified, alerts, suggestions, severity_score, ai_confidence } = data;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const handleTranslate = async (lang) => {
    setTargetLang(lang);
    setTranslating(true);
    setTranslation("");
    try {
      const response = await translateText(summary, lang);
      setTranslation(response.data.translatedText);
    } catch (err) {
      setTranslation("Failed to translate. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  const labRows = useMemo(() => {
    const lines = extractedText.split("\n").map(l => l.trim()).filter(Boolean);
    const rows = [];
    for (const line of lines) {
      const labMatch = line.match(/^([A-Za-z ()/-]+):\s*([0-9.]+(?:\/[0-9.]+)?(?:\s*[A-Za-z/%]+)?)(?:\s*\((High|Low|Elevated|Normal|Abnormal|Critical)\))?/i);
      if (!labMatch) continue;
      const [, test, val, rawStatus] = labMatch;
      const status = (rawStatus || "Unknown").toLowerCase();
      rows.push({ test: test.trim(), value: val.trim(), status, abnormal: ["high", "low", "elevated", "abnormal", "critical"].includes(status) });
    }
    return rows;
  }, [extractedText]);

  const alertGroups = useMemo(() => {
    const grouped = { critical: [], warning: [], info: [] };
    for (const a of alerts) {
      const l = a.toLowerCase();
      if (l.includes("critical")) grouped.critical.push(a);
      else if (l.includes("high") || l.includes("low") || l.includes("elevated") || l.includes("abnormal")) grouped.warning.push(a);
      else grouped.info.push(a);
    }
    return grouped;
  }, [alerts]);

  const followUpItems = useMemo(() => {
    const text = `${summary}. ${simplified}`.toLowerCase();
    const actions = [];
    if (text.includes("follow-up")) actions.push("Schedule follow-up with your clinician.");
    if (text.includes("diet")) actions.push("Review diet plan and reduce sugar/sodium.");
    if (text.includes("insulin") || text.includes("medication")) actions.push("Take prescribed medication exactly.");
    if (text.includes("diabetes") || text.includes("glucose")) actions.push("Track blood glucose daily.");
    if (actions.length === 0) actions.push("Discuss this report with your doctor.");
    return actions;
  }, [simplified, summary]);

  const extractedPreview = useMemo(() => {
    if (!normalizedSearch) return extractedText;
    const parts = extractedText.split(new RegExp(`(${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((part, i) => part.toLowerCase() === normalizedSearch ? <mark key={i} className="bg-yellow-200">{part}</mark> : <span key={i}>{part}</span>);
  }, [extractedText, normalizedSearch]);

  const handleCopy = async (value, field) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1200);
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const text = `MEDICAL ANALYTICA REPORT\nSummary: ${summary}\nSimplified: ${simplified}\nAlerts: ${alerts.join(", ")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "med-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-mesh overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 p-10 overflow-y-auto h-screen scrollbar-hide no-print">
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto pb-20">
          
          <header className="flex justify-between items-center mb-10">
            <div>
              <p className="text-medprimary-500 font-bold uppercase tracking-widest text-[10px] mb-1">Diagnostic Result</p>
              <h2 className="text-4xl font-heading font-bold text-medtext">Analysis <span className="text-slate-400 font-medium">Dashboard</span></h2>
            </div>
            
            <div className="flex gap-4">
              <button onClick={handlePrint} className="glass px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-white transiton-all duration-300">
                <FiPrinter /> Print Report
              </button>
              <button onClick={handleDownload} className="relative group bg-medprimary-500 px-6 py-3 rounded-2xl flex items-center gap-2 text-white font-bold shadow-xl shadow-medprimary-200 overflow-hidden transition-all active:scale-95">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <FiDownload className="relative z-10" /> <span className="relative z-10">Export Analysis</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Summary with Translation */}
              <ResultCard title="Executive Summary" icon={<FiActivity />} accent="border-medprimary-500">
                <div className="space-y-6">
                  <div className="bg-white/50 p-6 rounded-[2rem] border border-white/60">
                    <p className="text-lg text-slate-700 leading-relaxed font-semibold italic">"{summary}"</p>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                      <TextToSpeech text={summary} />
                      <button onClick={() => handleCopy(summary, "summary")} className="flex items-center gap-2 text-sm text-medprimary-500 font-bold hover:text-medprimary-600 transition-colors">
                        {copiedField === "summary" ? <FiCheck /> : <FiCopy />}
                        {copiedField === "summary" ? "Copied" : "Copy English"}
                      </button>
                    </div>
                  </div>

                  <div className="glass shadow-premium rounded-[2.5rem] p-8 border-t-8 border-medprimary-500">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-medprimary-50 rounded-2xl flex items-center justify-center text-medprimary-500">
                          <FiGlobe size={24} />
                        </div>
                        <h4 className="text-lg font-bold">Smart Translation</h4>
                      </div>
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                        {["Hindi", "Tamil", "English"].map(lang => (
                          <button 
                            key={lang}
                            onClick={() => lang === "English" ? setTranslation("") : handleTranslate(lang)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                              (targetLang === lang && (translation || lang === "English")) ? "bg-white text-medprimary-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {translating ? (
                        <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                          <div className="animate-spin text-medprimary-500"><FiRefreshCw size={40} /></div>
                          <p className="text-sm font-bold animate-pulse">Translating to {targetLang}...</p>
                        </motion.div>
                      ) : translation ? (
                        <motion.div key="result" initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                           <div className="bg-gradient-to-br from-medprimary-50 to-white/50 p-8 rounded-[2rem] border-2 border-medprimary-100 shadow-inner">
                            <p className="text-xl text-slate-800 font-heading leading-relaxed leading-[1.8] font-medium tracking-tight">
                              {translation}
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <button onClick={() => handleCopy(translation, "translated")} className="flex items-center gap-2 text-sm text-medprimary-500 font-bold hover:text-medprimary-600">
                                {copiedField === "translated" ? <FiCheck /> : <FiCopy />}
                                Copy {targetLang}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="idle" className="py-12 text-center">
                          <p className="text-slate-400 text-sm">Select a language above to translate the summary.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </ResultCard>

              {/* Health Metrics & AI Confidence */}
              <div className="grid grid-cols-2 gap-6">
                <div className="glass rounded-[2rem] p-6 border-l-4 border-amber-400">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnostic Severity</p>
                   <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-slate-700">{severity_score || 0}%</span>
                      <span className="text-xs text-slate-400 mb-1">Index Score</span>
                   </div>
                   <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${severity_score}%`}} className="h-full bg-amber-400" />
                   </div>
                </div>
                <div className="glass rounded-[2rem] p-6 border-l-4 border-medprimary-500">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">AI Confidence Level</p>
                   <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-slate-700">{ai_confidence || 0}%</span>
                      <span className="text-xs text-slate-400 mb-1">Precision Match</span>
                   </div>
                   <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${ai_confidence}%`}} className="h-full bg-medprimary-500" />
                   </div>
                </div>
              </div>

              {/* Lifestyle Suggestions */}
              {suggestions && (
                <ResultCard title="AI Lifestyle Suggestions" icon={<FiActivity />} accent="border-rose-400">
                  <div className="bg-rose-50/30 p-8 rounded-[2rem] border-2 border-rose-100 italic text-slate-700 leading-relaxed font-medium">
                    {suggestions}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={() => handleCopy(suggestions, "suggestions")} className="flex items-center gap-2 text-sm text-rose-500 font-bold">
                      {copiedField === "suggestions" ? <FiCheck /> : <FiCopy />}
                      Copy Suggestions
                    </button>
                  </div>
                </ResultCard>
              )}

              {/* Simplified Explanation */}
              <ResultCard title="Simplified Methodology" icon={<FiInfo />} accent="border-medsuccess">
                <div className="bg-emerald-50/30 p-8 rounded-[2rem] border-2 border-emerald-100 leading-relaxed text-slate-700 leading-[1.7]">
                   {simplified}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => handleCopy(simplified, "simplified")} className="flex items-center gap-2 text-sm text-medsuccess font-bold">
                    {copiedField === "simplified" ? <FiCheck /> : <FiCopy />}
                    Copy Text
                  </button>
                </div>
              </ResultCard>

              {/* Lab Values Table */}
              <ResultCard title="Structured Lab Results" icon={<FiCheck />} accent="border-slate-400">
                {labRows.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white/40 shadow-sm mt-4">
                    <table className="w-full">
                      <thead className="bg-slate-50/50 text-left">
                        <tr>
                          <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest">Biomarker</th>
                          <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest">Observed Value</th>
                          <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-widest text-right">Diagnosis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {labRows.map((row, idx) => (
                          <motion.tr 
                            key={idx}
                            initial={{opacity:0, x:-20}}
                            animate={{opacity:1, x:0}}
                            transition={{delay: idx * 0.05}}
                            className="group hover:bg-white transition-colors"
                          >
                            <td className="px-8 py-5 font-bold text-slate-700">{row.test}</td>
                            <td className="px-8 py-5 font-medium text-slate-600">{row.value}</td>
                            <td className="px-8 py-5 text-right">
                              <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${row.abnormal ? 'bg-rose-50 text-meddanger' : 'bg-emerald-50 text-medsuccess'}`}>
                                {row.status}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-slate-400 italic">No structured biomarkers detected in the text.</p>
                )}
              </ResultCard>
            </div>

            {/* Sidebar Columns */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Critical Alerts Card */}
              <section className="glass rounded-[2.5rem] p-8 border-l-8 border-meddanger card-hover shadow-premium shadow-rose-100">
                <div className="flex items-center gap-3 mb-6">
                  <FiAlertCircle className="text-meddanger" size={24} />
                  <h3 className="text-xl font-heading font-bold">Health Alerts</h3>
                </div>
                
                {alerts.length > 0 ? (
                   <div className="space-y-6">
                      {alertGroups.critical.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-meddanger tracking-widest mb-3">Critical Risk</p>
                          <div className="flex flex-wrap gap-3">
                            {alertGroups.critical.map(a => <AlertBadge key={a} text={a} />)}
                          </div>
                        </div>
                      )}
                      {alertGroups.warning.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-3">Abnormal Levels</p>
                          <div className="flex flex-wrap gap-3">
                            {alertGroups.warning.map(a => <AlertBadge key={a} text={a} />)}
                          </div>
                        </div>
                      )}
                      {alertGroups.info.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Observation</p>
                          <div className="flex flex-wrap gap-3">
                            {alertGroups.info.map(a => <AlertBadge key={a} safe text={a} />)}
                          </div>
                        </div>
                      )}
                   </div>
                ) : (
                  <AlertBadge safe text="Perfectly Healthy Values" />
                )}
              </section>

              {/* Follow up Actions */}
              <section className="glass rounded-[2.5rem] p-8 bg-gradient-to-br from-white/80 to-emerald-50/30 overflow-hidden relative border-t-8 border-medsuccess">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-medsuccess/10 rounded-full blur-3xl" />
                <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-3">
                   <FiCheck className="text-medsuccess" />
                   Recommended Actions
                </h3>
                <ul className="space-y-4">
                   {followUpItems.map((item, i) => (
                     <motion.li key={i} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: i*0.1}} className="flex items-start gap-3 p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-medsuccess shrink-0 mt-0.5">
                          <FiChevronRight size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 leading-relaxed">{item}</span>
                     </motion.li>
                   ))}
                </ul>
              </section>

              {/* Raw Extracted Text */}
              <section className="glass-dark rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-3">
                    <FiFileText className="text-slate-400" />
                    Original Text
                  </h3>
                  <button onClick={() => setShowExtracted(!showExtracted)} className="text-xs font-bold text-medprimary-500 uppercase tracking-widest hover:underline transition-all">
                    {showExtracted ? "Collapse" : "Expand Source"}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showExtracted && (
                    <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="space-y-4 overflow-hidden">
                       <div className="relative">
                          <FiSearch className="absolute left-4 top-3.5 text-slate-300" />
                          <input 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white/50 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold border-2 border-white/40 focus:border-medprimary-200 outline-none placeholder:text-slate-300"
                            placeholder="Find keyword..."
                          />
                       </div>
                       <div className="max-h-96 overflow-y-auto bg-black/5 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap selection:bg-slate-200">
                          {extractedPreview}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!showExtracted && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">Click expand to view original scan</p>}
              </section>

              <button onClick={() => navigate("/")} className="w-full py-5 rounded-[2rem] border-2 border-slate-200 text-slate-500 font-bold hover:bg-white hover:text-medprimary-500 hover:border-medprimary-500 transition-all duration-300 transform active:scale-95 group">
                <span className="flex items-center justify-center gap-2">
                  Begin New Analysis
                  <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Simplified Mobile Result - Just in case */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-medprimary-500 blur-sm z-[100] no-print" />
    </div>
  );
};

export default ResultPage;
