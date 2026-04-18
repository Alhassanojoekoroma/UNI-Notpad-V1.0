"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MODULES = [
  {
    title: "Module 1: AI Study Assistant",
    sub: "10 learning tools, unlimited conversations",
    body: "Chat with Gemini AI using your actual course materials as context. Includes 10 learning tools: study guides, MCQ quizzes, fill-in-the-blanks, concept explainers, exam prep, audio overviews, and more.",
  },
  {
    title: "Module 2: Course Materials Hub",
    sub: "PDF, PPTX, DOCX — all in one place",
    body: "Lecturers upload materials tagged by faculty, semester, and programme. Students browse, search, download, and rate content. An in-app PDF viewer with annotation support replaces email attachments forever.",
  },
  {
    title: "Module 3: Progress Tracking",
    sub: "Quizzes, goals, and grade tracker",
    body: "Track quiz scores with colour-coded badges, set personal learning goals with target dates, and record grades per module. All data is exportable as CSV or JSON.",
  },
  {
    title: "Module 4: Task & Schedule Manager",
    sub: "Deadlines, priorities, and collaboration",
    body: "Add tasks with deadlines, priority levels, and tags. Invite classmates to collaborate. Weekly timetable view synced with lecturer-uploaded schedules. Deadline countdown timers.",
  },
  {
    title: "Module 5: Discussion Forums",
    sub: "Per-module boards, threaded Q&A",
    body: "Searchable, persistent discussion boards for each module. Students post questions, upvote answers, and mark accepted solutions. Lecturers pin announcements. Replaces WhatsApp groups with something that actually works.",
  },
  {
    title: "Module 6: Admin & Lecturer Portals",
    sub: "Full control for institutions",
    body: "Admins configure faculties, programmes, semester structure, and branding. Lecturers upload, manage, and track engagement. Full audit log. Platform-wide analytics dashboard.",
  },
];

const FAQS = [
  {
    q: "Who is UniNotepad for?",
    a: "UniNotepad is for universities, students, and lecturers. Students use it to access course materials and study with AI. Lecturers manage content. Admins configure the platform. Any university can deploy it for free.",
  },
  {
    q: "How much does it cost to deploy?",
    a: "The software is completely free (MIT license). You'll need a server — a $5–10/month VPS is enough for a small university. The only ongoing cost is your Gemini API key, which has a generous free tier from Google. You can also use a self-hosted LLM via Ollama for zero API costs.",
  },
  {
    q: "How difficult is it to set up?",
    a: "If your IT team is comfortable with Docker, setup takes about 30 minutes. Clone the repo, fill in the .env file, run docker-compose up, and complete the setup wizard to configure your university's name, faculties, and programmes.",
  },
  {
    q: "What AI tools do students get?",
    a: "Students get 10 AI learning tools: Study Guide, MCQ Quiz, Fill in the Blanks, Matching Quiz, True/False Quiz, Concept Explainer, Study Plan Generator, Audio Overview (podcast-style), Exam Prep, and Note Summary. All tools work with students' actual uploaded course materials.",
  },
  {
    q: "Is student data safe and private?",
    a: "Yes. UniNotepad collects only what it needs to function. No ads, no data selling, no third-party tracking. Students can export all their data in JSON or CSV format at any time, and can permanently delete their account with full data purge.",
  },
];

interface Props {
  universityName: string;
  section?: "accordion" | "faq";
}

export function LandingInteractive({ universityName, section }: Props) {
  const [openModule, setOpenModule] = useState(0);
  const [openFaq, setOpenFaq]       = useState<number | null>(null);

  /* FAQ only */
  if (section === "faq") {
    return (
      <div className="flex flex-col">
        {FAQS.map((item, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden border-b border-[#dbdbdb] py-4"
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#0f0f0f]">{item.q}</span>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="shrink-0 transition-transform duration-200"
                style={{ transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                <circle cx="16" cy="16" r="15" fill="none" stroke="#ccc" strokeWidth="1.5" />
                <path d="M10 16h12M16 10v12" stroke="#999" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div
              className="overflow-hidden text-base text-[#484848] transition-all duration-300"
              style={{ maxHeight: openFaq === i ? 400 : 0, paddingTop: openFaq === i ? 12 : 0 }}
            >
              {item.a}
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* Default: accordion + pricing card (curriculum section) */
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {/* Accordion column */}
      <div className="flex flex-1 flex-col">
        {MODULES.map((mod, i) => (
          <div
            key={i}
            className="cursor-pointer border-b border-[#2b2b2b] py-4"
            onClick={() => setOpenModule(i)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[20px] font-semibold text-white">{mod.title}</h3>
                <p className="mt-1 text-base text-[#ededed]">{mod.sub}</p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
                <svg width="16" height="16" viewBox="0 0 32 32">
                  <path
                    d="M14.667 14.667V6.667H17.334V14.667H25.334V17.334H17.334V25.334H14.667V17.334H6.667V14.667Z"
                    fill="black"
                    style={{ transform: openModule === i ? "rotate(45deg)" : "none", transformOrigin: "center", transition: "transform .2s" }}
                  />
                </svg>
              </div>
            </div>
            {openModule === i && (
              <p className="mt-3 text-base leading-relaxed text-[#999]">{mod.body}</p>
            )}
          </div>
        ))}
      </div>

      {/* Pricing card */}
      <div className="w-full shrink-0 rounded-[20px] border border-[#dbdbdb] bg-white p-3 lg:w-[320px]">
        {/* Top purple block */}
        <div className="flex min-h-[175px] flex-col justify-between rounded-[14px] bg-[#5e41e4] p-5">
          <p className="text-[20px] font-semibold text-white">Free Plan</p>
          <div>
            <p className="font-[Manrope,sans-serif] text-[62px] font-semibold leading-[1.1] text-white">$0</p>
            <p className="text-sm text-[#ededed]">Forever. MIT Licensed.</p>
          </div>
        </div>

        {/* Info block */}
        <div className="mt-3 flex flex-col gap-3 rounded-[14px] border border-[#dbdbdb] bg-[#ededed] p-4">
          <h3 className="text-[20px] font-semibold text-[#0f0f0f]">{universityName} Open Source</h3>
          <p className="text-base text-[#484848]">
            Deploy at your university for free. MIT licensed — use it, modify it, distribute it.
          </p>

          {/* Avatar row */}
          <div className="flex items-center gap-1" style={{ marginLeft: 0 }}>
            {(["#5e41e4","#1a1a2e","#0f3460"] as const).map((bg, i) => (
              <div key={i} className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white text-xs font-bold text-white" style={{ background: bg, marginLeft: i === 0 ? 0 : -8 }}>
                {["FK","IS","AB"][i]}
              </div>
            ))}
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white bg-white text-xs font-semibold text-[#080808]" style={{ marginLeft: -8 }}>
              4K+
            </div>
          </div>

          <p className="text-sm font-medium text-[#0f0f0f]">WHAT'S INCLUDED</p>
          <ul className="flex flex-col gap-0">
            {[
              "20 free AI queries per day",
              "All course materials access",
              "Discussion forums & messaging",
              "Full data export at any time",
            ].map((item) => (
              <li key={item} className="flex items-center gap-1 p-2">
                <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 25">
                  <path d="M12 22.9C6.477 22.9 2 18.4 2 12.9S6.477 2.9 12 2.9s10 4.477 10 10-4.477 10-10 10zm-1-4l7.07-7.07-1.414-1.415-5.656 5.657-2.829-2.829-1.414 1.414L11 18.9z" fill="#5E41E4" />
                </svg>
                <span className="text-base text-[#484848]">{item}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full justify-center rounded-lg bg-black py-3 text-sm font-medium text-white hover:opacity-90"
            render={<Link href="/register" />}
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}