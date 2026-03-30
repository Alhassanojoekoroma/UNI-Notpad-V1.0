"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSaveQuizScore } from "@/hooks/use-ai";

// Types for different quiz formats
type MCQQuestion = {
  question: string;
  options: string[];
  answer: string; // "A", "B", "C", or "D"
  explanation: string;
};

type TrueFalseQuestion = {
  question: string;
  answer: string; // "true" or "false"
  explanation: string;
};

type FillBlankQuestion = {
  sentence: string;
  answer: string;
  explanation: string;
};

type MatchingPair = {
  columnA: string;
  columnB: string;
};

type QuizType = "mcq" | "true_false" | "fill_blanks" | "matching";

interface QuizInterfaceProps {
  type: QuizType;
  data: {
    questions?: (MCQQuestion | TrueFalseQuestion | FillBlankQuestion)[];
    pairs?: MatchingPair[];
  };
  module: string;
}

// MCQ Quiz
function MCQQuiz({
  questions,
  onComplete,
}: {
  questions: MCQQuestion[];
  onComplete: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    const score = questions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.answer ? 1 : 0);
    }, 0);
    onComplete(score, questions.length);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const isCorrect = submitted && answers[i] === q.answer;
        const isWrong = submitted && answers[i] !== q.answer && answers[i] !== undefined;

        return (
          <Card key={i} className={cn(submitted && (isCorrect ? "border-green-500/50" : isWrong ? "border-red-500/50" : ""))}>
            <CardContent className="pt-4">
              <p className="mb-3 text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              <RadioGroup
                value={answers[i] || ""}
                onValueChange={(v) =>
                  !submitted && setAnswers({ ...answers, [i]: v })
                }
                className="space-y-2"
              >
                {q.options.map((option, j) => {
                  const letter = String.fromCharCode(65 + j);
                  const isOptionCorrect = submitted && letter === q.answer;
                  const isOptionSelected = answers[i] === letter;

                  return (
                    <Label
                      key={j}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        !submitted && "hover:bg-muted",
                        submitted && isOptionCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
                        submitted && isOptionSelected && !isOptionCorrect && "border-red-500 bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      <RadioGroupItem value={letter} disabled={submitted} />
                      {option}
                    </Label>
                  );
                })}
              </RadioGroup>
              {submitted && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-muted p-2 text-xs">
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                  )}
                  <span className="text-muted-foreground">
                    {!isCorrect && <span className="font-medium">Correct: {q.answer}. </span>}
                    {q.explanation}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full"
        >
          Submit Answers
        </Button>
      )}
    </div>
  );
}

// True/False Quiz
function TrueFalseQuiz({
  questions,
  onComplete,
}: {
  questions: TrueFalseQuestion[];
  onComplete: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    const score = questions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.answer ? 1 : 0);
    }, 0);
    onComplete(score, questions.length);
  };

  return (
    <div className="space-y-3">
      {questions.map((q, i) => {
        const isCorrect = submitted && answers[i] === q.answer;
        const isWrong = submitted && answers[i] !== q.answer && answers[i] !== undefined;

        return (
          <Card key={i} className={cn(submitted && (isCorrect ? "border-green-500/50" : isWrong ? "border-red-500/50" : ""))}>
            <CardContent className="pt-4">
              <p className="mb-2 text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              <RadioGroup
                value={answers[i] || ""}
                onValueChange={(v) =>
                  !submitted && setAnswers({ ...answers, [i]: v })
                }
                className="flex gap-4"
              >
                {["true", "false"].map((val) => (
                  <Label
                    key={val}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm",
                      !submitted && "hover:bg-muted",
                      submitted && val === q.answer && "border-green-500 bg-green-50 dark:bg-green-950/20",
                      submitted && answers[i] === val && val !== q.answer && "border-red-500 bg-red-50 dark:bg-red-950/20"
                    )}
                  >
                    <RadioGroupItem value={val} disabled={submitted} />
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </Label>
                ))}
              </RadioGroup>
              {submitted && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-muted p-2 text-xs">
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                  )}
                  <span className="text-muted-foreground">{q.explanation}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full"
        >
          Submit Answers
        </Button>
      )}
    </div>
  );
}

// Fill in the blanks
function FillBlanksQuiz({
  questions,
  onComplete,
}: {
  questions: FillBlankQuestion[];
  onComplete: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    const score = questions.reduce((acc, q, i) => {
      const userAnswer = (answers[i] || "").trim().toLowerCase();
      const correct = q.answer.trim().toLowerCase();
      return acc + (userAnswer === correct ? 1 : 0);
    }, 0);
    onComplete(score, questions.length);
  };

  return (
    <div className="space-y-3">
      {questions.map((q, i) => {
        const userAnswer = (answers[i] || "").trim().toLowerCase();
        const correct = q.answer.trim().toLowerCase();
        const isCorrect = submitted && userAnswer === correct;
        const isWrong = submitted && userAnswer !== correct;

        // Split sentence at the blank
        const parts = q.sentence.split("___");

        return (
          <Card key={i} className={cn(submitted && (isCorrect ? "border-green-500/50" : isWrong ? "border-red-500/50" : ""))}>
            <CardContent className="pt-4">
              <div className="mb-2 flex flex-wrap items-center gap-1 text-sm">
                <span className="font-medium">{i + 1}.</span>
                {parts[0]}
                <Input
                  value={answers[i] || ""}
                  onChange={(e) =>
                    !submitted &&
                    setAnswers({ ...answers, [i]: e.target.value })
                  }
                  disabled={submitted}
                  className={cn(
                    "mx-1 inline-block h-7 w-40 text-sm",
                    submitted && isCorrect && "border-green-500",
                    submitted && isWrong && "border-red-500"
                  )}
                  placeholder="Your answer"
                />
                {parts[1]}
              </div>
              {submitted && (
                <div className="flex items-start gap-2 rounded-md bg-muted p-2 text-xs">
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                  )}
                  <span className="text-muted-foreground">
                    {!isCorrect && (
                      <span className="font-medium">Answer: {q.answer}. </span>
                    )}
                    {q.explanation}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!submitted && (
        <Button onClick={handleSubmit} className="w-full">
          Check Answers
        </Button>
      )}
    </div>
  );
}

// Matching quiz
function MatchingQuiz({
  pairs,
  onComplete,
}: {
  pairs: MatchingPair[];
  onComplete: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Shuffle column B for the quiz
  const [shuffledB] = useState(() =>
    [...pairs.map((p) => p.columnB)].sort(() => Math.random() - 0.5)
  );

  const handleSubmit = () => {
    setSubmitted(true);
    const score = pairs.reduce((acc, pair, i) => {
      return acc + (answers[i] === pair.columnB ? 1 : 0);
    }, 0);
    onComplete(score, pairs.length);
  };

  return (
    <div className="space-y-3">
      {pairs.map((pair, i) => {
        const isCorrect = submitted && answers[i] === pair.columnB;
        const isWrong = submitted && answers[i] !== pair.columnB && answers[i] !== undefined;

        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-md border p-3",
              submitted && isCorrect && "border-green-500/50 bg-green-50/50 dark:bg-green-950/10",
              submitted && isWrong && "border-red-500/50 bg-red-50/50 dark:bg-red-950/10"
            )}
          >
            <span className="min-w-0 flex-1 text-sm font-medium">
              {pair.columnA}
            </span>
            <span className="text-muted-foreground">=</span>
            <select
              value={answers[i] || ""}
              onChange={(e) =>
                !submitted &&
                setAnswers({ ...answers, [i]: e.target.value })
              }
              disabled={submitted}
              className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Select match...</option>
              {shuffledB.map((option, j) => (
                <option key={j} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {submitted && !isCorrect && (
              <span className="text-xs text-green-600">{pair.columnB}</span>
            )}
          </div>
        );
      })}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < pairs.length}
          className="w-full"
        >
          Check Matches
        </Button>
      )}
    </div>
  );
}

// Score display
function ScoreDisplay({ score, total }: { score: number; total: number }) {
  const percentage = Math.round((score / total) * 100);
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center gap-3 py-4">
        <Trophy
          className={cn(
            "size-8",
            percentage >= 70 ? "text-yellow-500" : "text-muted-foreground"
          )}
        />
        <div>
          <p className="text-lg font-semibold">
            {score}/{total}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage}% —{" "}
            {percentage >= 90
              ? "Excellent!"
              : percentage >= 70
                ? "Good job!"
                : percentage >= 50
                  ? "Keep studying!"
                  : "Needs more practice"}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-lg">
          {percentage}%
        </Badge>
      </CardContent>
    </Card>
  );
}

export function QuizInterface({ type, data, module }: QuizInterfaceProps) {
  const [score, setScore] = useState<{ score: number; total: number } | null>(null);
  const saveScore = useSaveQuizScore();

  const handleComplete = (score: number, total: number) => {
    setScore({ score, total });
    saveScore.mutate({
      module,
      quizType: type,
      score,
      totalQuestions: total,
    });
  };

  return (
    <div className="space-y-4">
      {score && <ScoreDisplay score={score.score} total={score.total} />}

      {type === "mcq" && data.questions && (
        <MCQQuiz
          questions={data.questions as MCQQuestion[]}
          onComplete={handleComplete}
        />
      )}

      {type === "true_false" && data.questions && (
        <TrueFalseQuiz
          questions={data.questions as TrueFalseQuestion[]}
          onComplete={handleComplete}
        />
      )}

      {type === "fill_blanks" && data.questions && (
        <FillBlanksQuiz
          questions={data.questions as FillBlankQuestion[]}
          onComplete={handleComplete}
        />
      )}

      {type === "matching" && data.pairs && (
        <MatchingQuiz pairs={data.pairs} onComplete={handleComplete} />
      )}
    </div>
  );
}
