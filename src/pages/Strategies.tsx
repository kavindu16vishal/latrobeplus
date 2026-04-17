import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, BookOpen, Brain, Lightbulb } from "lucide-react";
import { mockStrategies } from "@/lib/mockData";

const categoryIcons = {
  practice: Beaker,
  revision: BookOpen,
  conceptual: Brain,
  metacognitive: Lightbulb,
};

const priorityStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const Strategies = () => (
  <div className="space-y-8">
    <div>
      <h1 className="font-display text-3xl font-bold">Study Strategies</h1>
      <p className="text-muted-foreground mt-1">Evidence-based recommendations tailored to your performance patterns</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mockStrategies.map((strategy, i) => {
        const Icon = categoryIcons[strategy.category];
        return (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-semibold text-foreground">{strategy.title}</h3>
                      <Badge variant="outline" className={priorityStyles[strategy.priority]}>
                        {strategy.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{strategy.description}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{strategy.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default Strategies;
