import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Coins, TrendingUp, Globe, ShieldCheck, Rocket, Target, Award, Briefcase, Home, Video, Bot, Star, BookOpen, MessageSquare, CheckCircle, Users, MapPin, FileText, BarChart3, GraduationCap, Cpu } from "lucide-react";
import { LandingInteractive } from "@/components/landing-interactive";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

export default async function LandingPage() {
  let universityName = "UniNotepad";
  try {
    const settings = await prisma.appSettings.findFirst();
    universityName = settings?.universityName ?? "UniNotepad";
  } catch {
    // DB unavailable (e.g. no internet / offline dev) — use default name
  }

  return (
    <>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section id="top" className="bg-black px-4 pb-20 pt-[140px] md:px-[60px]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-[60px] lg:flex-row">

          {/* Hero Left */}
          <AnimateOnScroll animation="aos-fade-right" className="flex w-full flex-shrink-0 flex-col gap-8 lg:w-[480px]">
            {/* Badge */}
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#6e6e6e] bg-[#484848] px-5 py-1 pr-5 pl-1">
              <span className="rounded-full bg-[#c7cbfe] px-2.5 py-1 text-xs font-semibold text-black">New</span>
              <span className="text-sm text-white">Now open-source on GitHub!</span>
            </div>

            {/* Title */}
            <h1 className="mt-4 mb-2 font-heading text-5xl font-semibold leading-[1.1] text-[#f2f1ef] md:text-[62px]">
              Supercharge Your Studies With AI
            </h1>

            {/* Description */}
            <p className="mb-6 text-[18px] leading-relaxed text-[#dbdbdb]">
              The only learning platform your university needs. Free to deploy. Free to use.
              Built for students in developing countries.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-5 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                render={<Link href="/register" />}
              >
                Enroll Now
                <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Button>
              <Button
                className="flex h-[48px] items-center rounded-[8px] border-[#ededed] bg-white px-5 py-3 text-base font-medium text-black hover:bg-gray-50"
                render={<Link href="/#curriculum" />}
              >
                See Curriculum
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-6">
              {[
                { icon: <Video className="h-5 w-5" />, label: "ONLINE" },
                { icon: <Bot className="h-5 w-5" />, label: "AI-POWERED" },
                { icon: <Star className="h-5 w-5" />, label: "OPEN-SOURCE" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-[#dbdbdb]">{s.icon}</span>
                  <span className="text-sm font-semibold tracking-wider text-[#dbdbdb]">{s.label}</span>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          {/* Hero Carousel — real student photos */}
          <div
            className="relative flex-1 overflow-hidden"
            style={{
              height: 413,
              maskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, black 20%, black 80%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div className="animate-carousel flex h-full w-max gap-2.5">
              {[
                { src: "/images/student-1.jpg", name: "Fatmata Koroma",  role: "Computer Science @ LUSL" },
                { src: "/images/student-2.jpg", name: "Ibrahim Sesay",   role: "Business Admin @ FBMG" },
                { src: "/images/student-3.jpg", name: "David Kamara",    role: "Engineering @ UNIMAK" },
                { src: "/images/student-4.jpg", name: "Aminata Bangura", role: "Communications @ FCMB" },
                { src: "/images/student-5.jpg", name: "Mariama Jalloh",  role: "Education @ NJALA" },
                /* duplicate for seamless loop */
                { src: "/images/student-1.jpg", name: "Fatmata Koroma",  role: "Computer Science @ LUSL" },
                { src: "/images/student-2.jpg", name: "Ibrahim Sesay",   role: "Business Admin @ FBMG" },
                { src: "/images/student-3.jpg", name: "David Kamara",    role: "Engineering @ UNIMAK" },
                { src: "/images/student-4.jpg", name: "Aminata Bangura", role: "Communications @ FCMB" },
                { src: "/images/student-5.jpg", name: "Mariama Jalloh",  role: "Education @ NJALA" },
              ].map((card, i) => (
                <div
                  key={i}
                  className="relative h-full w-[280px] flex-shrink-0 overflow-hidden rounded-[20px]"
                >
                  <Image
                    src={card.src}
                    alt={card.name}
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.90) 100%)" }}
                  />
                  <div className="absolute bottom-6 left-5 right-5">
                    <p className="text-sm font-semibold text-white">{card.name}</p>
                    <p className="mt-0.5 text-xs text-[#c7cbfe]">{card.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted-by ticker */}
      <div className="bg-black px-4 pb-20 pt-0 md:px-[60px]">
        <p className="mb-3 text-sm font-medium text-[#6e6e6e]">TRUSTED BY UNIVERSITIES</p>
        <div
          className="overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)" }}
        >
          <div className="animate-ticker flex w-max items-center gap-[62px] py-2">
            {[...Array(2)].flatMap((_, copyIdx) =>
              ["LIMKOKWING SL", "NJALA UNIVERSITY", "FOURAH BAY COLLEGE", "ERNEST BAIKOROMA UNIV", "UNIVERSITY OF MAKENI"].map(
                (name) => (
                  <span key={`${copyIdx}-${name}`} className="shrink-0 whitespace-nowrap font-heading text-sm font-semibold text-[#555]">
                    {name}
                  </span>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          OVERVIEW
      ════════════════════════════════════════ */}
      <section id="overview" className="flex justify-center bg-[#f2f1ef] px-4 py-[100px] md:px-10">
        <div className="w-full max-w-[1280px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">

            {/* Left */}
            <AnimateOnScroll animation="aos-fade-right" className="flex flex-1 flex-col gap-12">
              <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-[#0f0f0f] md:text-[48px]">
                The One platform for all university
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-5 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                  render={<Link href="/register" />}
                >
                  Enroll Now
                  <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="flex h-[48px] items-center rounded-[8px] border-[#ededed] bg-white px-5 py-3 text-base font-medium text-black hover:bg-gray-50"
                  render={<Link href="/#curriculum" />}
                >
                  See Curriculum
                </Button>
              </div>
              <ul className="flex flex-col">
                {[
                  "AI study assistant with access to your actual course materials — no generic answers.",
                  "All course materials in one place. No more WhatsApp groups and scattered PDFs.",
                  "10 AI learning tools: quizzes, study guides, exam prep, audio overviews, and more.",
                  "Open-source and free to deploy at any university. MIT licensed.",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-1 p-2">
                    <svg className="mt-0.5 h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="black">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-4l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11 18z" />
                    </svg>
                    <span className="text-base text-[#484848]">{text}</span>
                  </li>
                ))}
              </ul>
            </AnimateOnScroll>

            {/* Hero image placeholder */}
            <div className="hidden flex-1 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5e41e4] to-[#1a1a2e] p-10 text-center text-white lg:flex">
              <div className="flex flex-col items-center">
                <div className="mb-4"><GraduationCap className="h-20 w-20 text-white" /></div>
                <p className="font-heading text-2xl font-semibold">AI-Powered Learning</p>
                <p className="mt-2 text-base opacity-75">Built for students who deserve better tools</p>
              </div>
            </div>

            {/* Feature cards */}
            <div className="flex flex-1 flex-col gap-4">
              {[
                { icon: <Bot className="h-6 w-6 text-[#5e41e4]" />, title: "AI Study Assistant", desc: "Chat with an AI that has read your actual lecture notes. Ask questions, generate quizzes — all from your real course content." },
                { icon: <BookOpen className="h-6 w-6 text-[#5e41e4]" />, title: "Organized Course Materials", desc: "Lecturers upload; students browse. Materials filtered to your exact faculty, semester, and programme. Rated and searchable." },
                { icon: <MessageSquare className="h-6 w-6 text-[#5e41e4]" />, title: "Discussion Forums", desc: "Per-module boards replace chaotic group chats. Ask questions, get answers, and build a searchable knowledge base your whole class benefits from." },
              ].map((card) => (
                <div key={card.title} className="flex items-start gap-4 rounded-xl bg-white p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8e4fd] text-xl">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="mb-2 text-[20px] font-semibold text-[#0f0f0f]">{card.title}</h3>
                    <p className="text-base text-[#484848]">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHY US
      ════════════════════════════════════════ */}
      <section id="features" className="flex justify-center bg-[#f2f1ef] px-4 pb-20 md:px-10">
        <div className="w-full max-w-[1280px]">
          <AnimateOnScroll animation="aos-fade-up" className="mb-12 flex flex-col items-center gap-6">
            <span className="w-fit rounded-full bg-[#5e41e4] px-4 py-2 text-base text-white">Why {universityName}?</span>
            <h2 className="font-heading text-center text-4xl font-semibold leading-[1.1] text-[#0f0f0f] md:text-[48px]">
              Why universities choose {universityName}
            </h2>
          </AnimateOnScroll>
          <div className="grid gap-[60px] sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Coins className="h-5 w-5" />, bg: "#8f78ffff", title: "Completely Free", desc: "No per-seat license, no hidden fees. Deploy the entire platform on a $5/month server. MIT licensed means zero restrictions." },
              { icon: <TrendingUp className="h-5 w-5" />, bg: "#8f78ffff", title: "Proven Impact", desc: "Started at Limkokwing University Sierra Leone in 2026. Students used it, results improved, and now we're sharing it with every university." },
              { icon: <BookOpen className="h-5 w-5" />, bg: "#8f78ffff", title: "10 AI Learning Tools", desc: "Study guides, MCQ quizzes, flashcards, audio overviews, exam prep and more — all generated from your actual course materials." },
              { icon: <Users className="h-5 w-5" />, bg: "#8f78ffff", title: "Built for Universities", desc: "Purpose-built for institutions. Faculties, programmes, semesters, and lecturers all have dedicated spaces. Admin dashboard included." },
              { icon: <Rocket className="h-5 w-5" />, bg: "#8f78ffff", title: "One-Command Deploy", desc: "Git clone, fill in .env, run docker-compose up. Your university has a fully working learning platform in under 30 minutes." },
              { icon: <ShieldCheck className="h-5 w-5" />, bg: "#8f78ffff", title: "Private & Secure", desc: "No ads. No data selling. No third-party tracking. Students own their data and can export or permanently delete it at any time." },
            ].map((card) => (
              <div key={card.title} className="flex flex-col items-center text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: card.bg }}>
                  {card.icon}
                </div>
                <h3 className="text-[20px] font-semibold text-[#0f0f0f]">{card.title}</h3>
                <p className="text-base leading-relaxed text-[#484848]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CURRICULUM  (interactive accordion)
      ════════════════════════════════════════ */}
      <section id="curriculum" className="flex justify-center bg-[#f2f1ef] px-2 py-2">
        <div className="w-full rounded-2xl bg-black px-4 py-[88px] md:px-10">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12">
            <AnimateOnScroll animation="aos-fade-up" className="flex flex-col items-center gap-4">
              <span className="w-fit rounded-full bg-[#5e41e4] px-4 py-2 text-base text-white">Modules</span>
              <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-white md:text-[48px]">
                Everything you get with {universityName}
              </h2>
            </AnimateOnScroll>

            {/* Interactive accordion + pricing card — client component */}
            <LandingInteractive universityName={universityName} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════ */}
      <section id="testimonials" className="flex justify-center bg-[#f2f1ef] px-4 py-20 md:px-10">
        <div className="w-full max-w-[1280px]">
          <div className="mb-12 flex flex-col items-center gap-12">
            <AnimateOnScroll animation="aos-fade-up" className="flex max-w-[600px] flex-col items-center gap-6 text-center">
              <span className="w-fit rounded-full bg-[#5e41e4] px-4 py-2 text-base text-white">Reviews</span>
              <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-[#0f0f0f] md:text-[48px]">
                Students across West Africa love it
              </h2>
              <p className="text-base leading-relaxed text-[#484848]">
                Our alumni mean everything to us. Seeing them succeed with better tools and then get hired at great companies makes every line of code worth it.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-5 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                  render={<Link href="/register" />}
                >
                  Enroll Now
                  <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="flex h-[48px] items-center rounded-[8px] border-[#ededed] bg-white px-5 py-3 text-base font-medium text-black hover:bg-gray-50"
                  render={<Link href="/#curriculum" />}
                >
                  See Curriculum
                </Button>
              </div>
            </AnimateOnScroll>

            {/* Logo ticker */}
            <div
              className="w-full overflow-hidden"
              style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)" }}
            >
              <div className="animate-ticker flex w-max items-center gap-20 py-2">
                {[...Array(2)].flatMap((_, copyIdx) =>
                  ["LIMKOKWING SIERRA LEONE", "FOURAH BAY COLLEGE", "NJALA UNIVERSITY", "UNIVERSITY OF MAKENI", "ERNEST BAIKOROMA UNIV"].map(
                    (name) => (
                      <span key={`${copyIdx}-${name}`} className="shrink-0 whitespace-nowrap font-heading text-base font-bold text-[#888]">
                        {name}
                      </span>
                    )
                  )
                )}
              </div>
            </div>
          </div>

          {/* Testimonial grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { initials: "FK", name: "Fatmata Koroma", role: "BIT Student @ LUSL", from: "#5e41e4", to: "#c7cbfe", quote: "The AI assistant actually read my lecture notes. I asked it to quiz me before my exam and the questions matched exactly what came up. I got a B+ — best grade I've had in three years." },
              { initials: "IS", name: "Ibrahim Sesay", role: "BBA Student @ FBMG", from: "#1a1a2e", to: "#5e41e4", quote: "Before UniNotepad, I had to be in five WhatsApp groups just to get my notes. Now everything is in one place and I can search it. My productivity tripled in the first week." },
              { initials: "AB", name: "Aminata Bangura", role: "BMC Student @ FCMB", from: "#0f3460", to: "#533483", quote: "The audio overview feature is a game changer. I commute 45 minutes each way and I listen to AI-generated summaries of my lecture notes. I arrive prepared." },
              { initials: "DK", name: "Dr. David Kamara", role: "Lecturer @ FICT", from: "#2d6a4f", to: "#40916c", quote: "As a lecturer, seeing exactly how many students engage with each file changed how I teach. I now know which topics students struggle with before the exam." },
              { initials: "MJ", name: "Mohamed Jalloh", role: "BCS Student @ FICT", from: "#b5179e", to: "#7209b7", quote: "I can't afford a ChatGPT subscription. UniNotepad gives me 20 free queries a day and when I need more I buy tokens with Monime. It's affordable and AI-knows my syllabus." },
              { initials: "JT", name: "James Tucker", role: "IT Admin @ University of Makeni", from: "#f72585", to: "#4361ee", quote: "We deployed UniNotepad for our entire university in one afternoon. The setup wizard is intuitive and docker-compose just works. This is open source that actually ships." },
            ].map((t) => (
              <div key={t.name} className="flex flex-col gap-5 rounded-lg border-r border-[#ededed] bg-white p-8">
                <div className="text-sm text-[#eab308]">★★★★★</div>
                <p className="text-base leading-relaxed text-[#484848]">{t.quote}</p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0f]">{t.name}</p>
                    <p className="text-xs text-[#6e6e6e]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CREATOR / INSTRUCTOR
      ════════════════════════════════════════ */}
      <section id="instructor" className="flex justify-center bg-[#f2f1ef] px-2 py-2">
        <div className="w-full rounded-2xl bg-black px-4 py-[88px] md:px-10">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start">
              {/* Photo */}
              <AnimateOnScroll animation="aos-zoom-in" className="relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black lg:w-[480px] aspect-[4/5]">  
                <Image
                  src="/images/alhassan.jpg"
                  alt="Alhassan Ojoe Koroma — creator of UniNotepad"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
              </AnimateOnScroll>

              {/* Content */}
              <AnimateOnScroll animation="aos-fade-left" className="flex flex-1 flex-col gap-6">
                <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-white md:text-[48px]">
                  Meet Alhassan Ojoe Koroma
                </h2>
                <p className="text-[18px] leading-relaxed text-white opacity-85">
                  Alhassan is a software developer and student from Sierra Leone who built {universityName} after seeing firsthand how difficult it was for students at African universities to access quality learning tools.
                </p>
                <p className="text-[18px] leading-relaxed text-white opacity-75">
                  He built the first version as LUSL Notepad at Limkokwing University Sierra Leone in early 2026. It worked. Students used it. Now he's giving it away to every university in the world.
                </p>
                <div className="flex flex-col gap-3 mt-4">
                  {[
                    { icon: <MapPin className="h-5 w-5" />, text: "Built at Limkokwing University Sierra Leone" },
                    { icon: <Users className="h-5 w-5" />, text: "1,500+ Active Students (growing)" },
                    { icon: <CheckCircle className="h-5 w-5" />, text: "MIT Licensed — Free to use forever" },
                  ].map((s) => (
                    <div key={s.text} className="flex items-center gap-3 p-2">
                      <span className="text-[#5e41e4] shrink-0">{s.icon}</span>
                      <span className="text-base text-white">{s.text}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#2b2b2b] pt-3">
                  <p className="mb-3 text-xs font-medium uppercase text-[#6e6e6e]">SDG Alignment</p>
                  <div className="flex flex-wrap gap-3">
                    {["SDG 4.3", "SDG 4.4", "SDG 4.a", "DPG Applying"].map((tag) => (
                      <span key={tag} className="rounded-lg border border-[#5e41e4] bg-[#5e41e433] px-4 py-2 text-sm font-semibold text-[#c7cbfe]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS / FEATURES
      ════════════════════════════════════════ */}
      <section id="stats" className="flex justify-center bg-[#f2f1ef] px-4 py-20 md:px-10">
        <div className="w-full max-w-[1280px]">
          <AnimateOnScroll animation="aos-fade-up" className="mb-10 flex flex-col items-center gap-6 text-center">
            <h2 className="font-heading mx-auto max-w-[440px] text-center text-4xl font-semibold leading-[1.1] text-[#0f0f0f] md:text-[48px]">
              Join students already studying smarter
            </h2>
            <p className="mx-auto max-w-[500px] text-center text-[18px] leading-relaxed text-[#484848]">
              Stop struggling alone. {universityName} gives every student the tools top institutions charge thousands for completely free.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <Button
                className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                render={<Link href="/register" />}
              >
                Enroll Now
                <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Button>
              <Button
                variant="outline"
                className="flex h-[48px] items-center rounded-[8px] border-[#ededed] bg-white px-6 py-3 text-base font-medium text-black hover:bg-gray-50"
                render={<Link href="/#curriculum" />}
              >
                See Curriculum
              </Button>
            </div>
          </AnimateOnScroll>

          {/* Feature cards row */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row">
            {[
              {
                header: (
                  <div className="flex aspect-[1.5] flex-col items-center justify-center rounded-lg bg-[#1a1a2e] text-center text-white" style={{ margin: 10 }}>
                    <div className="flex flex-col items-center">
                      <div className="mb-3"><Cpu className="h-12 w-12 text-[#5e41e4]" /></div>
                      <p className="font-semibold">AI Study Assistant</p>
                      <p className="mt-1 text-xs opacity-70">Gemini-powered, course-aware</p>
                    </div>
                  </div>
                ),
                title: "AI-powered courses",
                desc: "Your AI tutor has read every lecture note. Ask anything. Get structured, course-specific answers.",
              },
              {
                header: (
                  <div className="flex aspect-[1.5] flex-col gap-2 rounded-lg bg-[#f8f4fe] p-4" style={{ margin: 10 }}>
                    {["Database Systems Notes", "Data Structures Slides"].map((name, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                        <span className="text-[#5e41e4]">
                          {i === 0 ? <FileText className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-black">{name}</p>
                          <p className="text-xs text-gray-400">Module {3 + i * 2} · PDF</p>
                        </div>
                        <span className="rounded bg-[#5e41e4] px-2 py-1 text-[10px] text-white">View</span>
                      </div>
                    ))}
                  </div>
                ),
                title: "Zero to hero",
                desc: "Go from scattered WhatsApp PDFs to a searchable, rated library of all your course content.",
              },
              {
                header: (
                  <div className="flex aspect-[1.5] flex-col gap-2 rounded-lg bg-[#0f3460] p-4" style={{ margin: 10 }}>
                    <div className="rounded-lg bg-white/10 p-3">
                      <p className="text-[10px] text-[#c7cbfe]">DISCUSSION FORUMS</p>
                      <p className="mt-1 text-sm font-semibold text-white">How do joins work in SQL?</p>
                      <p className="mt-1 text-xs text-gray-400">3 replies · ✓ Answered</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3">
                      <p className="text-[10px] text-[#c7cbfe]">UPCOMING</p>
                      <p className="mt-1 text-sm font-semibold text-white">DB Exam — 3 days</p>
                    </div>
                  </div>
                ),
                title: "Thriving community",
                desc: "Searchable, persistent forums replace group chats. Build knowledge that helps every student.",
              },
            ].map((card) => (
              <div key={card.title} className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white">
                {card.header}
                <div className="flex flex-col gap-2 px-5 pb-5">
                  <h3 className="text-[20px] font-semibold text-[#0f0f0f]">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-[#6e6e6e]">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stat numbers */}
          <div className="flex flex-wrap gap-4">
            {[
              { num: "10+", label: "AI learning tools" },
              { num: "20/day", label: "free AI queries" },
              { num: "MIT", label: "open-source license" },
              { num: "∞", label: "access, forever" },
            ].map((s) => (
              <div key={s.label} className="flex min-w-[160px] flex-1 flex-col gap-4 rounded-xl bg-white p-6">
                <p className="font-heading text-5xl font-semibold text-[#0f0f0f]">{s.num}</p>
                <p className="text-lg text-[#6e6e6e]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          COMMUNITY
      ════════════════════════════════════════ */}
      <section className="overflow-hidden bg-white px-4 py-20 md:px-10">
        <div className="flex flex-col items-center gap-12">
          <AnimateOnScroll animation="aos-fade-up" className="flex max-w-[500px] flex-col items-center gap-4 text-center">
            <span className="w-fit rounded-full bg-[#5e41e4] px-4 py-2 text-base text-white">Community</span>
            <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-[#0f0f0f] md:text-[48px]">
              Connect with students from 150+ countries
            </h2>
            <p className="text-base leading-relaxed text-[#484848]">
              It's your gateway to a career. With {universityName}, you'll gain the skills, confidence, and community to stand out wherever you go.
            </p>
            <Button
              className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
              render={<Link href="/register" />}
            >
              Join the community
              <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Button>
          </AnimateOnScroll>

          {/* Scrolling rows */}
          <div className="flex w-full flex-col gap-2.5">
            {[
              { dir: "fwd", items: ["/images/student-1.jpg", "/images/student-2.jpg", "/images/student-3.jpg", "/images/student-4.jpg", "/images/student-5.jpg", "/images/student-1.jpg", "/images/student-2.jpg", "/images/student-3.jpg"] },
              { dir: "rev", items: ["/images/student-4.jpg", "/images/student-5.jpg", "/images/student-1.jpg", "/images/student-2.jpg", "/images/student-3.jpg", "/images/student-4.jpg", "/images/student-5.jpg", "/images/student-1.jpg"] },
            ].map(({ dir, items }) => (
              <div
                key={dir}
                className="overflow-hidden"
                style={{ maskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)" }}
              >
                <div className={`${dir === "fwd" ? "animate-scroll-fwd" : "animate-scroll-rev"} flex h-[138px] w-max gap-2.5`}>
                  {[...items, ...items].map((src, i) => (
                    <div
                      key={i}
                      className="relative h-[138px] w-[152px] shrink-0 overflow-hidden rounded-lg bg-black/5"
                    >
                      <Image
                        src={src}
                        alt="Community member"
                        fill
                        className="object-cover"
                        sizes="152px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ  (interactive — client component)
      ════════════════════════════════════════ */}
      <section id="faq" className="flex justify-center bg-[#f2f1ef] px-4 py-[88px] md:px-10">
        <div className="w-full max-w-[922px]">
          <AnimateOnScroll animation="aos-fade-up" className="mb-12 flex flex-col items-center gap-6 text-center">
            <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-[#0f0f0f] md:text-[48px]">
              Frequently asked questions
            </h2>
            <p className="text-base text-[#484848]">
              Everything you need to know before deploying {universityName} at your university.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-5 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                render={<Link href="/register" />}
              >
                Enroll Now
                <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Button>
              <Button
                variant="outline"
                className="flex h-[48px] items-center rounded-[8px] border-[#ededed] bg-white px-5 py-3 text-base font-medium text-black hover:bg-gray-50"
                render={<Link href="/#curriculum" />}
              >
                See Curriculum
              </Button>
            </div>
          </AnimateOnScroll>
          <LandingInteractive universityName={universityName} section="faq" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="text-[18px] text-[#0f0f0f]">Have more questions? Email us:</span>
            <a href="mailto:hello@uninotepad.org" className="text-[18px] text-[#5e41e4] no-underline hover:underline">
              hello@uninotepad.org
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          BOTTOM CTA
      ════════════════════════════════════════ */}
      <section className="flex justify-center bg-[#f2f1ef] px-2 pb-2">
        <AnimateOnScroll animation="aos-zoom-in" className="flex w-full overflow-hidden rounded-2xl bg-[#5e41e4]" style={{ minHeight: 400 }}>
          {/* Content */}
          <div className="flex flex-col justify-center gap-5 px-10 py-16" style={{ flex: 1, maxWidth: "47%" }}>
            <h2 className="font-heading text-4xl font-semibold leading-[1.1] text-white md:text-[48px]">
              Start Your Learning Journey Today!
            </h2>
            <p className="text-[18px] leading-relaxed text-white opacity-85">
              Join hundreds of students already using AI to study smarter. Free to deploy, free to use — your university's learning revolution starts here.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                className="flex h-[48px] items-center gap-3 rounded-[8px] bg-white px-5 py-3 text-base font-medium text-[#0f0f0f] transition-opacity hover:opacity-90"
                render={<Link href="/register" />}
              >
                Enroll Now
                <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#5e41e4] text-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Button>
              <Button
                className="flex h-[48px] items-center rounded-[8px] border border-white/30 bg-transparent px-5 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
                render={<Link href="/#curriculum" />}
              >
                See Curriculum
              </Button>
            </div>
          </div>

          {/* Decorative right panel */}
          <div className="hidden flex-1 items-center justify-end overflow-hidden p-8 lg:flex">
            <div className="flex w-[360px] flex-col gap-3 rounded-2xl bg-white/10 p-6">
              <div className="rounded-xl bg-white/15 p-4 text-white">
                <p className="text-xs opacity-70">AI STUDY ASSISTANT</p>
                <p className="mt-1.5 text-sm font-semibold">Explain hash tables using my Database Systems notes</p>
                <p className="mt-2 text-xs opacity-60">Generating study guide... ✨</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 text-white">
                <p className="text-xs opacity-70">TODAY'S QUERIES</p>
                <p className="mt-1 text-xl font-bold">12 / 20 used</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[60%] rounded-full bg-white" />
                </div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 text-white">
                <p className="text-xs opacity-70">UPCOMING DEADLINE</p>
                <p className="mt-1 text-sm font-semibold">Database Exam — 2 days</p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </>
  );
}