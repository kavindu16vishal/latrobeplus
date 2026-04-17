import { motion } from "framer-motion";

interface MasteryBarProps {
  label: string;
  value: number;
  status: "strong" | "developing" | "gap";
}

const statusColors = {
  strong: "bg-success",
  developing: "bg-warning",
  gap: "bg-destructive",
};

const statusLabels = {
  strong: "Strong",
  developing: "Developing",
  gap: "Gap",
};

const MasteryBar = ({ label, value, status }: MasteryBarProps) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{value}%</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          status === "strong" ? "bg-success/10 text-success" :
          status === "developing" ? "bg-warning/10 text-warning" :
          "bg-destructive/10 text-destructive"
        }`}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${statusColors[status]}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  </div>
);

export default MasteryBar;
