import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Star, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MasteryRing from "@/components/MasteryRing";
import MasteryBar from "@/components/MasteryBar";
import { mockSubjects, studentProfile } from "@/lib/mockData";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const allOutcomes = mockSubjects.flatMap((s) => s.outcomes);
  const gaps = allOutcomes.filter((o) => o.status === "gap");
  const strengths = allOutcomes.filter((o) => o.status === "strong");

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Welcome back, {studentProfile.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your learning journey overview for {mockSubjects[0].semester}
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Overall Mastery", value: `${studentProfile.overallMastery}%`, color: "text-primary" },
          { icon: BookOpen, label: "Active Subjects", value: mockSubjects.length.toString(), color: "text-info" },
          { icon: Star, label: "Strengths", value: strengths.length.toString(), color: "text-success" },
          { icon: AlertTriangle, label: "Knowledge Gaps", value: gaps.length.toString(), color: "text-destructive" },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mastery Overview */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg">Overall Mastery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4">
              <MasteryRing value={studentProfile.overallMastery} label="Across all subjects" />
              <div className="mt-6 w-full space-y-3">
                {mockSubjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.code}</span>
                    <span className="text-muted-foreground">{s.overallMastery}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Knowledge Gaps */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.4 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg">Competency Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSubjects.map((subject) => (
                <div key={subject.id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {subject.code} — {subject.name}
                  </p>
                  <div className="space-y-3">
                    {subject.outcomes.map((outcome) => (
                      <MasteryBar
                        key={outcome.id}
                        label={outcome.title}
                        value={outcome.mastery}
                        status={outcome.status}
                      />
                    ))}
                  </div>
                  <div className="border-b border-border my-4 last:hidden" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
