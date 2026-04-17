import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { mockLearningPlan } from "@/lib/mockData";
import { useState } from "react";

const typeVariants: Record<string, string> = {
  practice: "bg-info/10 text-info border-info/20",
  revision: "bg-warning/10 text-warning border-warning/20",
  quiz: "bg-primary/10 text-primary border-primary/20",
  conceptual: "bg-success/10 text-success border-success/20",
  metacognitive: "bg-accent/10 text-accent border-accent/20",
};

const LearningPlan = () => {
  const [plan, setPlan] = useState(mockLearningPlan);

  const toggleTask = (weekId: string, taskIdx: number) => {
    setPlan((prev) =>
      prev.map((w) =>
        w.id === weekId
          ? { ...w, tasks: w.tasks.map((t, i) => (i === taskIdx ? { ...t, completed: !t.completed } : t)) }
          : w
      )
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Learning Plan</h1>
        <p className="text-muted-foreground mt-1">Your personalised weekly plan targeting identified knowledge gaps</p>
      </div>

      <div className="space-y-6">
        {plan.map((week, i) => {
          const completed = week.tasks.filter((t) => t.completed).length;
          return (
            <motion.div
              key={week.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg">Week {week.weekNumber}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {completed}/{week.tasks.length} completed
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completed / week.tasks.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {week.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => toggleTask(week.id, idx)}
                    >
                      <Checkbox checked={task.completed} />
                      <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className={typeVariants[task.type]}>
                        {task.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPlan;
