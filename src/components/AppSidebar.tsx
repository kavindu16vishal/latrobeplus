import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, BrainCircuit, Lightbulb, ClipboardList, GraduationCap, Sparkles } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/learning-plan", icon: ClipboardList, label: "Learning Plan" },
  { to: "/quiz", icon: BrainCircuit, label: "Adaptive Quiz" },
  { to: "/strategies", icon: Lightbulb, label: "Study Strategies" },
  { to: "/ai-chat", icon: Sparkles, label: "AI Assistant" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Latrobe+</h1>
            <p className="text-xs opacity-70">Learning Journey Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold">
            AC
          </div>
          <div>
            <p className="text-sm font-medium">Alex Chen</p>
            <p className="text-xs opacity-60">B. Computer Science</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
