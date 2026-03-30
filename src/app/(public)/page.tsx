import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Bot, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

const features = [
  {
    icon: BookOpen,
    title: "Course Materials",
    description:
      "Access lecture notes, assignments, timetables, and more — organized by faculty and semester.",
  },
  {
    icon: Bot,
    title: "AI Study Assistant",
    description:
      "Get help with your studies using an AI-powered assistant with 10 learning tools.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description:
      "Monitor your learning goals, quiz scores, and study habits over time.",
  },
  {
    icon: Users,
    title: "Collaborate",
    description:
      "Message peers, join module forums, share tasks, and study together.",
  },
];

export default async function LandingPage() {
  const settings = await prisma.appSettings.findFirst();
  const universityName = settings?.universityName ?? "UniNotepad";

  return (
    <div className="flex flex-col">
      <section className="container mx-auto flex flex-col items-center gap-8 px-4 py-20 text-center md:py-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to{" "}
          <span className="text-primary">{universityName}</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Your all-in-one learning platform. Browse course materials, study with
          AI, track your progress, and collaborate with classmates.
        </p>
        <div className="flex gap-4">
          <Button size="lg" render={<Link href="/register" />}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Sign In
          </Button>
        </div>
      </section>

      <section className="border-t bg-muted/50">
        <div className="container mx-auto grid gap-8 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-6" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="#" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="#" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:underline">
              Code of Conduct
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} {universityName}</p>
        </div>
      </footer>
    </div>
  );
}
