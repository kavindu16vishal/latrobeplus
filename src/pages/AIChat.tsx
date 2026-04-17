import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/chatStream";
import { studentProfile } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const exampleQuestions = [
  "What should I focus on this week?",
  "Explain container orchestration simply",
  "How can I improve my transaction management?",
  "Create a study plan for my upcoming exam",
];

const AIChat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi ${studentProfile.name.split(" ")[0]}! I'm your Learning Journey Assistant. How can I help you today?` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      onDelta: upsert,
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false);
        toast({ title: "AI Error", description: err, variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">AI Learning Assistant</h1>
            <p className="text-muted-foreground">Get personalised insights and answers to your learning questions</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <strong>Important:</strong> AI suggestions are for guidance only. Always verify recommendations with your instructors and use your own judgement for academic decisions.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-[500px]">
            <CardContent className="flex-1 p-4 overflow-y-auto max-h-[500px] space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center ml-2 shrink-0 mt-1 text-accent-foreground text-xs font-bold">
                        AC
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>

            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your learning..."
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning" /> Example Questions
              </h3>
              {exampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="block w-full text-left text-sm p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-display font-semibold">Your Quick Stats</h3>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Average Mastery</span>
              </div>
              <p className="text-3xl font-display font-bold">{studentProfile.overallMastery}%</p>

              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-info" />
                <span className="text-xs text-muted-foreground">Active Subjects</span>
              </div>
              <p className="text-3xl font-display font-bold">3</p>

              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground">Focus Areas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {studentProfile.gaps.map((g) => (
                  <Badge key={g} variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                    {g}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-display font-semibold">I can help you with:</h3>
              {[
                "Personalised study recommendations",
                "Explaining difficult concepts",
                "Creating custom learning plans",
                "Identifying knowledge gaps",
                "Resource recommendations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
