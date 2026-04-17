import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { mockQuizQuestions } from "@/lib/mockData";

const Quiz = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = mockQuizQuestions[currentIdx];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === question.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= mockQuizQuestions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / mockQuizQuestions.length) * 100);
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Adaptive Quiz</h1>
          <p className="text-muted-foreground mt-1">Questions aligned with your identified knowledge gaps</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="py-12 space-y-4">
              <div className="text-6xl font-display font-bold text-primary">{pct}%</div>
              <p className="text-lg font-medium">You scored {score}/{mockQuizQuestions.length}</p>
              <p className="text-muted-foreground text-sm">
                {pct >= 80 ? "Excellent work! Your understanding is strong." :
                 pct >= 60 ? "Good progress. Review the gaps to keep improving." :
                 "Keep practising — focus on your recommended study strategies."}
              </p>
              <Button onClick={handleRestart} className="mt-4">
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Adaptive Quiz</h1>
        <p className="text-muted-foreground mt-1">Questions aligned with your identified knowledge gaps</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Question {currentIdx + 1} of {mockQuizQuestions.length}
          </span>
          <Badge variant="outline">{question.difficulty}</Badge>
        </div>

        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((currentIdx + 1) / mockQuizQuestions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg leading-relaxed">{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((option, idx) => {
                  const isCorrect = idx === question.correctIndex;
                  const isSelected = idx === selected;
                  let optionStyle = "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer";
                  if (answered) {
                    if (isCorrect) optionStyle = "border-success bg-success/5";
                    else if (isSelected && !isCorrect) optionStyle = "border-destructive bg-destructive/5";
                    else optionStyle = "border-border opacity-50";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${optionStyle}`}
                      disabled={answered}
                    >
                      <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm">{option}</span>
                      {answered && isCorrect && <CheckCircle2 className="w-5 h-5 text-success ml-auto" />}
                      {answered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                    </button>
                  );
                })}

                {answered && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
                    <Button onClick={handleNext} className="w-full">
                      {currentIdx + 1 >= mockQuizQuestions.length ? "See Results" : "Next Question"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
