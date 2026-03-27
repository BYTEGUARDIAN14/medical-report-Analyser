import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { FiFileText, FiImage, FiTrash2, FiUploadCloud, FiZap } from "react-icons/fi";

const FileUploader = ({ selectedFile, onFileChange, onFileDrop, onSampleLoad, onClearFile, error }) => {
  const inputRef = useRef(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const onDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFileDrop(dropped);
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const ext = selectedFile?.name?.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png"].includes(ext);

  return (
    <div className="space-y-6">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        className="cursor-pointer rounded-[2rem] border-4 border-dashed border-white/40 bg-white/20 p-12 text-center transition-all duration-300 hover:border-medprimary-300 hover:bg-white/40 group shadow-inner relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-medprimary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-wrap" />
        
        <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-white shadow-premium flex items-center justify-center text-medprimary-500 group-hover:scale-110 transition-transform duration-500 relative z-10">
          <FiUploadCloud size={32} />
        </div>
        <h4 className="text-xl font-bold text-slate-700 mb-2 relative z-10">Import Medical Record</h4>
        <p className="text-sm text-slate-500 relative z-10">Drag & drop your files here or <span className="text-medprimary-500 font-bold underline decoration-2 underline-offset-4">browse local storage</span></p>
        <div className="mt-8 flex justify-center gap-4 relative z-10">
            <span className="px-4 py-1.5 bg-white/60 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/60">PDF / TXT</span>
            <span className="px-4 py-1.5 bg-white/60 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/60">JPG / PNG</span>
        </div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
      />

      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center justify-between rounded-3xl border-2 border-white/60 bg-white/50 p-6 shadow-premium backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-medprimary-100 rounded-2xl flex items-center justify-center text-medprimary-500">
                {isImage ? <FiImage size={24} /> : <FiFileText size={24} />}
              </div>
              <div>
                <p className="font-bold text-slate-700 truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  {formatBytes(selectedFile.size)} • {ext?.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearFile}
              className="w-10 h-10 rounded-xl bg-rose-50 text-meddanger flex items-center justify-center hover:bg-rose-100 transition-colors"
            >
              <FiTrash2 size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <div className="h-[2px] bg-slate-100 flex-1" />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Or try internal demo</span>
        <div className="h-[2px] bg-slate-100 flex-1" />
      </div>

      <button
        type="button"
        onClick={onSampleLoad}
        className="w-full relative group py-4 rounded-2xl border-2 border-white bg-white/40 text-slate-600 font-bold hover:bg-white hover:text-medprimary-500 hover:border-medprimary-200 transition-all shadow-sm flex items-center justify-center gap-2 overflow-hidden"
      >
        <FiZap className="text-amber-400 group-hover:scale-125 transition-transform" />
        Load Medical Demo Data
      </button>

      {error && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-4 rounded-2xl bg-rose-50 border-l-4 border-meddanger text-meddanger text-sm font-bold">
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default FileUploader;
