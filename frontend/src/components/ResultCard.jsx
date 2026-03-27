import { motion } from "framer-motion";

const ResultCard = ({ title, children, icon, accent = "border-medprimary-500", delay = 0 }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass rounded-[2rem] p-8 border-l-8 ${accent} card-hover h-full`}
    >
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-medprimary-500">{icon}</div>}
        <h3 className="text-xl font-heading font-bold text-medtext leading-tight">{title}</h3>
      </div>
      <div className="text-slate-600 leading-relaxed font-medium">
        {children}
      </div>
    </motion.section>
  );
};

export default ResultCard;
