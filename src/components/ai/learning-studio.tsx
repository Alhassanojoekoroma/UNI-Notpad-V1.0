"use client";

import { useState } from "react";
import {
  BookOpen,
  ListChecks,
  TextCursor,
  ArrowLeftRight,
  ToggleLeft,
  Lightbulb,
  Calendar,
  GraduationCap,
  FileText,
  Headphones,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGenerateLearningTool, useGenerateAudio } from "@/hooks/use-ai";
import { QuizInterface } from "./quiz-interface";
import { AudioPlayer } from "./audio-player";

const TOOLS = [
  {
    id: "study_guide",
    label: "Study Guide",
    description: "Comprehensive study guide with key concepts",
    icon: BookOpen,
    category: "study",
  },
  {
    id: "quiz_mcq",
    label: "MCQ Quiz",
    description: "10 multiple choice questions with explanations",
    icon: ListChecks,
    category: "quiz",
  },
  {
    id: "fill_blanks",
    label: "Fill in Blanks",
    description: "10 fill-in-the-blank exercises",
    icon: TextCursor,
    category: "quiz",
  },
  {
    id: "matching",
    label: "Matching",
    description: "Match terms with their definitions",
    icon: ArrowLeftRight,
    category: "quiz",
  },
  {
    id: "true_false",
    label: "True / False",
    description: "12 true/false statements with explanations",
    icon: ToggleLeft,
    category: "quiz",
  },
  {
    id: "concept_explainer",
    label: "Concept Explainer",
    description: "6-part deep dive into a concept",
    icon: Lightbulb,
    category: "study",
  },
  {
    id: "study_plan",
    label: "Study Plan",
    description: "2-3 week structured study plan",
    icon: Calendar,
    category: "study",
  },
  {
    id: "exam_prep",
    label: "Exam Prep",
    description: "Practice questions and exam tips",
    icon: GraduationCap,
    category: "study",
  },
  {
    id: "note_summary",
    label: "Note Summary",
    description: "Concise bullet-point notes",
    icon: FileText,
    category: "study",
  },
  {
    id: "audio_overview",
    label: "Audio Overview",
    description: "Listen to a narrated summary",
    icon: Headphones,
    category: "audio",
  },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

interface LearningStudioProps {
  selectedSourceIds: string[];
}

function ToolCard({
  tool,
  onClick,
}: {
  tool: (typeof TOOLS)[number];
  onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <span className="text-sm font-medium">{tool.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{tool.description}</p>
    </button>
  );
}

function MarkdownResult({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-1 size-3" />
          ) : (
            <Copy className="mr-1 size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}

export function LearningStudio({ selectedSourceIds }: LearningStudioProps) {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<{
    toolType: string;
    content: string;
    structured?: unknown;
  } | null>(null);
  const [audioResult, setAudioResult] = useState<{
    script: string;
    audioBase64?: string | null;
  } | null>(null);
  const [narrationStyle, setNarrationStyle] = useState<"single" | "conversation">("single");

  const generateTool = useGenerateLearningTool();
  const generateAudio = useGenerateAudio();

  const isQuizType = ["quiz_mcq", "true_false", "fill_blanks", "matching"].includes(activeTool || "");
  const isAudioType = activeTool === "audio_overview";

  const handleGenerate = async () => {
    if (!activeTool || selectedSourceIds.length === 0) return;

    setResult(null);
    setAudioResult(null);

    if (isAudioType) {
      const data = await generateAudio.mutateAsync({
        sourceContentIds: selectedSourceIds,
        narrationStyle,
      });
      setAudioResult(data);
    } else {
      const data = await generateTool.mutateAsync({
        toolType: activeTool,
        sourceContentIds: selectedSourceIds,
        topic: topic || undefined,
      });
      setResult(data);
    }
  };

  const handleBack = () => {
    setActiveTool(null);
    setResult(null);
    setAudioResult(null);
    setTopic("");
  };

  const isPending = generateTool.isPending || generateAudio.isPending;
  const error = generateTool.error || generateAudio.error;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <GraduationCap data-icon="inline-start" />
        Learning Tools
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          {activeTool ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={handleBack}>
                <ArrowLeft className="size-4" />
              </Button>
              <SheetTitle>
                {TOOLS.find((t) => t.id === activeTool)?.label}
              </SheetTitle>
            </div>
          ) : (
            <SheetTitle>Learning Studio</SheetTitle>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-4">
            {!activeTool ? (
              // Tool selection grid
              <div>
                {selectedSourceIds.length === 0 && (
                  <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-50/50 p-3 text-xs text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200">
                    Select at least one source material before using learning
                    tools.
                  </div>
                )}

                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedSourceIds.length} source{selectedSourceIds.length !== 1 && "s"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onClick={() => setActiveTool(tool.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Active tool view
              <div className="space-y-4">
                {!result && !audioResult && !isPending && (
                  <div className="space-y-3">
                    {!isAudioType && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Topic / Focus (optional)
                        </Label>
                        <Input
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="E.g., photosynthesis, data structures..."
                          className="mt-1"
                        />
                      </div>
                    )}

                    {isAudioType && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Narration Style
                        </Label>
                        <div className="mt-1.5 flex gap-2">
                          {(["single", "conversation"] as const).map((style) => (
                            <Button
                              key={style}
                              variant={narrationStyle === style ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNarrationStyle(style)}
                            >
                              {style === "single" ? "Single Narrator" : "Two Hosts"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleGenerate}
                      disabled={selectedSourceIds.length === 0}
                      className="w-full"
                    >
                      Generate
                    </Button>
                  </div>
                )}

                {isPending && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Generating...
                    </div>
                    <Skeleton className="h-40 w-full" />
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-red-500/30 bg-red-50/50 p-3 text-xs text-red-800 dark:bg-red-950/20 dark:text-red-200">
                    {error.message}
                  </div>
                )}

                {/* Quiz results */}
                {result && isQuizType && !!result.structured && (
                  <QuizInterface
                    type={
                      activeTool === "quiz_mcq"
                        ? "mcq"
                        : activeTool === "true_false"
                          ? "true_false"
                          : activeTool === "fill_blanks"
                            ? "fill_blanks"
                            : "matching"
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data={result.structured as any}
                    module={topic || "General"}
                  />
                )}

                {/* Text results (study guide, notes, etc.) */}
                {result && !isQuizType && (
                  <MarkdownResult content={result.content} />
                )}

                {/* Quiz fallback: if JSON parsing failed, show raw text */}
                {result && isQuizType && !result.structured && (
                  <MarkdownResult content={result.content} />
                )}

                {/* Audio results */}
                {audioResult && (
                  <AudioPlayer
                    script={audioResult.script}
                    audioBase64={audioResult.audioBase64}
                  />
                )}

                {(result || audioResult) && (
                  <Button variant="outline" onClick={handleBack} className="w-full">
                    Back to Tools
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
