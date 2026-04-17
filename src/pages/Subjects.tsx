import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MasteryRing from "@/components/MasteryRing";
import MasteryBar from "@/components/MasteryBar";
import { mockSubjects } from "@/lib/mockData";

const Subjects = () => (
  <div className="space-y-8">
    <div>
      <h1 className="font-display text-3xl font-bold">Subjects</h1>
      <p className="text-muted-foreground mt-1">Your enrolled subjects and learning outcome mastery</p>
    </div>

    <div className="space-y-6">
      {mockSubjects.map((subject, i) => (
        <motion.div
          key={subject.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl">{subject.code}: {subject.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{subject.semester}</p>
                </div>
                <MasteryRing value={subject.overallMastery} size={80} strokeWidth={8} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {subject.outcomes.map((o) => (
                <div key={o.id}>
                  <MasteryBar label={o.title} value={o.mastery} status={o.status} />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">{o.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Subjects;
