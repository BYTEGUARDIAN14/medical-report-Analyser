import { FiUpload, FiClock, FiSettings, FiActivity, FiHelpCircle } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: "Analyze", path: "/", icon: <FiUpload size={20} /> },
    { name: "Recent", path: "/history", icon: <FiClock size={20} /> },
    { name: "Health", path: "/health", icon: <FiActivity size={20} /> },
  ];

  return (
    <aside className="w-64 h-screen bg-white/40 backdrop-blur-xl border-r border-white/20 fixed left-0 top-0 z-50 flex flex-col p-6 shadow-premium transition-all duration-300">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-medprimary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-medprimary-200 float-animation">
          <FiActivity size={24} />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-medtext tracking-tight">MedAnalytica</h1>
          <p className="text-[10px] uppercase tracking-widest text-medprimary-500 font-bold">Intelligence Pro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
              location.pathname === link.path
                ? "bg-medprimary-500 text-white shadow-lg shadow-medprimary-200"
                : "text-slate-500 hover:bg-white hover:text-medprimary-500"
            }`}
          >
            {link.icon}
            <span className="font-medium">{link.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-white hover:text-medprimary-500 transition-all rounded-xl">
          <FiHelpCircle size={20} />
          <span className="font-medium">Support</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-white hover:text-medprimary-500 transition-all rounded-xl">
          <FiSettings size={20} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
