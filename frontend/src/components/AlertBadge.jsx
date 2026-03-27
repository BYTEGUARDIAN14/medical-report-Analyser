const AlertBadge = ({ text, safe = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-bold shadow-sm transition-all duration-300 ${
        safe
          ? "bg-emerald-50 text-medsuccess border-2 border-medsuccess/20 hover:bg-emerald-100"
          : "bg-rose-50 text-meddanger border-2 border-meddanger/20 hover:bg-rose-100"
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${safe ? 'bg-medsuccess' : 'bg-meddanger'}`} />
      {text}
    </span>
  );
};

export default AlertBadge;
