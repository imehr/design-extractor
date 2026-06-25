"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

/* ---------- Assets ---------- */
const CERTIFICATE_SRC = "/brands/ailearninglab-live/certificate.png";

const PAST_VIDEOS = [
  { src: "/brands/ailearninglab-live/yt-spK_stxP1d4.jpg", title: "Building Trustable AI at 100 MPH, presented in English", lang: "ENGLISH" },
  { src: "/brands/ailearninglab-live/yt--PjlWODC0uE.jpg", title: "Building Trustable AI at 100 MPH, presented in Portuguese", lang: "PORTUGUESE" },
  { src: "/brands/ailearninglab-live/yt-8gBsK3IT6cM.jpg", title: "Building Trustable AI at 100 MPH, presented in Spanish", lang: "SPANISH" },
  { src: "/brands/ailearninglab-live/yt-5-qyndvp4MQ.jpg", title: "Create your own AI agent with ADK", lang: "SPANISH" },
  { src: "/brands/ailearninglab-live/yt-Q5TtNiEmRJM.jpg", title: "Create your own AI agent with ADK", lang: "ENGLISH" },
];

const MONTHS = [
  { id: "may", label: "May 2026" },
  { id: "jun", label: "Jun 2026" },
  { id: "jul", label: "Jul 2026" },
  { id: "aug", label: "Aug 2026" },
  { id: "sep", label: "Sep 2026" },
  { id: "oct", label: "Oct 2026" },
  { id: "nov", label: "Nov 2026" },
];

const UPCOMING_EVENTS = [
  {
    month: "May 2026",
    monthId: "may",
    events: [
      { title: "Build Your First AI Companion: A Beginner's Workshop, presented in English", date: "May 27, 2026", lang: "PRESENTED IN ENGLISH" },
      { title: "Build Your First AI Companion: A Beginner's Workshop, presented in Spanish", date: "May 28, 2026", lang: "PRESENTED IN SPANISH" },
      { title: "Build Your First AI Companion: A Beginner's Workshop, presented in Portuguese", date: "May 29, 2026", lang: "PRESENTED IN PORTUGUESE" },
    ],
  },
  {
    month: "June 2026",
    monthId: "jun",
    events: [
      { title: "ADK Master Class: Build AI Agents That Remember and Take Action, presented in English", date: "June 24, 2026", lang: "PRESENTED IN ENGLISH" },
      { title: "ADK Master Class: Build AI Agents That Remember and Take Action, presented in Spanish", date: "June 25, 2026", lang: "PRESENTED IN SPANISH" },
      { title: "ADK Master Class: Build AI Agents That Remember and Take Action, presented in Portuguese", date: "June 30, 2026", lang: "PRESENTED IN PORTUGUESE" },
    ],
  },
  {
    month: "July 2026",
    monthId: "jul",
    events: [
      { title: "Building with Google Antigravity", date: "July 29, 2026", lang: "PRESENTED IN ENGLISH" },
      { title: "Building with Google Antigravity", date: "July 30, 2026", lang: "PRESENTED IN PORTUGUESE" },
      { title: "Building with Google Antigravity", date: "July 31, 2026", lang: "PRESENTED IN SPANISH" },
    ],
  },
  {
    month: "August 2026",
    monthId: "aug",
    events: [
      { title: "Agentverse - The Shadowblade's Codex - Vibecoding with Gemini CLI", date: "August 26, 2026", lang: "PRESENTED IN ENGLISH" },
      { title: "Building a Production AI Code Review Assistant with Google ADK", date: "August 27, 2026", lang: "PRESENTED IN SPANISH" },
    ],
  },
  {
    month: "September 2026",
    monthId: "sep",
    events: [
      { title: "Getting Started with MCP, ADK and A2A Sao Paulo", date: "September 17, 2026", lang: "PRESENTED IN PORTUGUESE" },
      { title: "Deploying Agents to Production [GDE Own codelab]", date: "September 29, 2026", lang: "PRESENTED IN ENGLISH" },
      { title: "Getting Started with MCP, ADK and A2A", date: "September 30, 2026", lang: "PRESENTED IN SPANISH" },
    ],
  },
  {
    month: "October 2026",
    monthId: "oct",
    events: [
      { title: "From Idea to Launch: Your First Application on Google Cloud in 2026", date: "October 29, 2026", lang: "PRESENTED IN PORTUGUESE" },
    ],
  },
  {
    month: "November 2026",
    monthId: "nov",
    events: [
      { title: "Coordinating Multiple Agents [GDE Own codelab]", date: "November 25, 2026", lang: "PRESENTED IN ENGLISH" },
      { title: "Building an Accessible Multimodal AI Agent: Voice Vision and Conversation", date: "November 27, 2026", lang: "PRESENTED IN PORTUGUESE" },
    ],
  },
];

export default function AILearningLabPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeMonth, setActiveMonth] = useState("may");
  const [scrolled, setScrolled] = useState(false);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-month-id");
            if (id) setActiveMonth(id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    const current = monthRefs.current;
    Object.values(current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const tabs = [
    { date: "May 27, 2026", lang: "English" },
    { date: "May 28, 2026", lang: "Spanish" },
    { date: "May 29, 2026", lang: "Portuguese" },
  ];

  const fontStack = '"Google Sans Flex", Roboto, -apple-system, BlinkMacSystemFont, sans-serif';
  const eventCardBorder = {
    background:
      "linear-gradient(#202124, #202124) padding-box, linear-gradient(120deg, #f18b2e 0%, #dd7d69 100%) border-box",
    border: "3px solid transparent",
  };

  return (
    <main className="relative min-h-screen bg-[#202124] text-white">
      {/* ===== Sticky Nav ===== */}
      <div
        data-component="nav"
        className={`fixed top-0 left-0 right-0 z-50 bg-black transition-all duration-300 ${
          scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <div className="text-xl font-bold leading-tight" style={{ fontFamily: fontStack }}>
                <span className="text-[#f58220]">AI</span>
                <span className="text-white"> Learning Lab</span>
              </div>
              <p className="text-xs leading-tight text-white/65">Google Developer Experts</p>
            </div>
          </div>
          <div className="flex items-center gap-7">
            <a href="#featured-events" className="text-sm font-medium text-white hover:text-white/80">This Month</a>
            <a href="#future-events" className="text-sm font-medium text-white/80 hover:text-white">Upcoming</a>
            <a href="#past-events" className="text-sm font-medium text-white/80 hover:text-white">Past</a>
            <button className="flex items-center gap-1 rounded border border-white/60 bg-white px-3 py-1.5 text-sm font-medium text-black">
              <span>en</span>
              <svg className="h-3.5 w-3.5 text-black/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Hero Lang Nav ===== */}
      <header className="absolute right-6 top-8 z-20">
        <button className="flex items-center gap-2 rounded border border-white/30 bg-transparent px-3 py-2 text-sm text-white">
          <span>en</span>
          <svg className="h-4 w-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </header>

      {/* ===== Hero ===== */}
      <section data-component="hero" className="relative w-full bg-[#202124] pb-8 pt-16">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-3 text-[44px] font-bold leading-[0.95] tracking-tight text-white" style={{ fontFamily: fontStack }}>
              <span className="text-[72px] leading-none text-[#ffe6b0]">{"{"}</span>
              <span className="text-left">
                <span className="block">Build</span>
                <span className="block">with AI</span>
              </span>
              <svg className="mx-0.5 h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5L22 9h-7l-3-7z" />
              </svg>
              <span className="text-[72px] leading-none text-[#ffe6b0]">{"}"}</span>
            </div>
          </div>
          <h1 className="mb-3 inline-flex rounded-full border-[3px] border-[#f58220] px-10 py-1 text-[60px] font-bold tracking-tight text-[#ff8a1c]" style={{ fontFamily: fontStack, lineHeight: 1.14 }}>
            AI Learning Lab
          </h1>
          <p className="mx-auto mb-5 max-w-[980px] text-[36px] text-white/90" style={{ fontFamily: fontStack, lineHeight: 1.6 }}>
            Join live hands-on sessions to build, learn, and experiment<br className="hidden md:block" />
            with AI tools and techniques.
          </p>
          <Link
            href="#future-events"
            className="inline-flex items-center justify-center rounded-full border-[3px] border-[#f58220] px-8 py-3 text-lg font-bold text-[#f58220] transition-colors hover:bg-[#f58220]/10"
            data-component="button-set"
          >
            View Upcoming Events
          </Link>
        </div>
      </section>

      {/* ===== Featured Event Tabs + Card ===== */}
      <section data-component="feature-section" id="featured-events" className="w-full bg-[#202124]">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="flex flex-wrap items-end gap-0">
            {tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`min-w-[220px] rounded-t-[32px] border-[3px] border-b-0 px-8 py-5 text-left transition-colors ${
                  activeTab === i
                    ? "border-[#f58220] bg-[#f58220] text-[#202124]"
                    : "border-white/30 bg-transparent text-white"
                }`}
              >
                <span className="block text-2xl font-bold">{tab.date}</span>
                <span className="block text-base font-bold">{tab.lang}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-6 pb-16">
          <div data-component="card" className="rounded-b-[34px] rounded-tr-[34px] p-10 md:p-12" style={eventCardBorder}>
            <div className="grid gap-14 md:grid-cols-[0.85fr_1fr]">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/45">
                  Presented in {tabs[activeTab].lang}
                </p>
                <h2 className="mb-8 text-[36px] font-bold leading-tight text-white">
                  Build Your First AI Companion: A Beginner&apos;s Workshop, presented in {tabs[activeTab].lang}
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="https://rsvp.withgoogle.com/events/ailearninglab-may-27-english/home"
                    className="inline-flex items-center justify-center rounded-full border-[3px] border-white px-9 py-3 text-2xl font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
              <div className="flex flex-col">
                <p className="mb-3 text-[27px] leading-[1.35] text-white/90">
                  Go beyond a basic chatbot to create a one-of-a-kind interactive AI companion. This learning lab walks through the steps to build the brain and personality of your AI companion, who will come to life with their own face and voice. You&apos;ll add layers of intelligence and agent customization using Gemini CLI, provide &quot;grounding&quot; education via Google Search, and generate a custom avatar. Your fully-functional, one-of-a-kind AI companion awaits!
                </p>
                <Link
                  href="https://ailearninglab.live/en/?tab=build-your-first-ai-companion-a-beginner-s-workshop-2026-05-15-english"
                  className="text-xl font-medium italic text-[#fbbc04] hover:text-[#f9a825]"
                >
                  Read More
                </Link>
              </div>
            </div>
            <div className="mt-24 grid grid-cols-2 gap-10 border-t border-white/10 pt-12 md:grid-cols-[1.05fr_0.9fr_1.25fr_auto]">
              <div>
                <p className="mb-3 flex items-center gap-2 text-[28px] font-bold uppercase tracking-wider text-[#a78bfa]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  When
                </p>
                <p className="text-base font-bold text-white/90">Wednesday, May 27, 2026</p>
                <p className="text-base font-bold text-white/90">1:30P-3:00P (PST)</p>
              </div>
              <div>
                <p className="mb-3 flex items-center gap-2 text-[28px] font-bold uppercase tracking-wider text-[#a78bfa]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Where
                </p>
                <p className="text-base font-bold text-white/90">Virtual</p>
              </div>
              <div>
                <p className="mb-3 flex items-center gap-2 text-[28px] font-bold uppercase tracking-wider text-[#a78bfa]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Key Themes
                </p>
                <p className="max-w-[250px] text-base font-bold leading-snug text-white/90">AI companions, Gemini CLI, Imagen, Agent ADK, Python, MCP Server, Nano Banana, Agent Grounding</p>
              </div>
              <div className="flex items-start">
                <span className="inline-block rounded-xl border-[3px] border-[#a78bfa] px-8 py-3 text-[28px] font-bold text-white">
                  FREE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== What to Expect ===== */}
      <section data-component="section" className="w-full py-24 text-[#202124]" style={{ background: "linear-gradient(120deg, #e39253 0%, #f2aa24 48%, #d48377 100%)" }}>
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid gap-20 md:grid-cols-2">
            <div>
              <p className="mb-5 text-2xl font-bold">What to Expect</p>
              <h2 className="text-[68px] font-bold tracking-tight">AI Learning Lab</h2>
            </div>
            <div>
              <p className="text-[26px] font-bold leading-[1.45] text-[#202124]">
                Each free hands-on event is presented in real-time, so you can hear tips and tricks straight from Google Developer Experts at the forefront of building with AI. We&apos;ll support you to troubleshoot and master the techniques and tools being taught.
              </p>
            </div>
          </div>
          <div className="my-14 border-t-2 border-[#202124]" />
          <div className="grid items-center gap-20 md:grid-cols-2">
            <div>
              <img src={CERTIFICATE_SRC} alt="Certificate of Completion" className="w-full max-w-[490px] rounded-md shadow-none" />
            </div>
            <div>
              <p className="mb-8 text-[27px] font-bold leading-[1.45] text-[#202124]">
                Bring your questions and build alongside other developers in a live, interactive learning lab.
              </p>
              <p className="text-[27px] font-bold leading-[1.45] text-[#202124]">
                You&apos;ll leave with practical experience, free Cloud Credits to keep the momentum going, and a Certificate of Completion to mark your achievement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Upcoming Events ===== */}
      <section id="future-events" data-component="section" className="w-full bg-[#202124] py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-4 text-center text-2xl font-bold text-[#f58220]">AI Learning Lab</p>
          <h2 className="mb-14 text-center text-[58px] font-bold tracking-tight text-white">Upcoming Events</h2>
          <div className="flex gap-8">
            {/* Month sidebar */}
            <aside className="hidden w-40 shrink-0 md:block">
              <nav className="sticky top-20 relative flex flex-col gap-5 border-l-2 border-white/20">
                {MONTHS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      document.getElementById(m.id)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`group relative flex items-center pl-7 py-1.5 text-left before:absolute before:left-[-5px] before:top-1/2 before:-translate-y-1/2 before:h-[10px] before:w-[10px] before:rounded-full before:transition-all before:duration-300 ${
                      activeMonth === m.id
                        ? "font-semibold text-white before:border-[3px] before:border-white before:bg-white"
                        : "text-white/45 hover:text-white/80 before:border-2 before:border-white/20 before:bg-[#333333] hover:before:border-white/50"
                    }`}
                  >
                    <span className="text-sm">{m.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Events list */}
            <div className="flex-1 space-y-8">
              {UPCOMING_EVENTS.map((group) => (
                <div
                  key={group.monthId}
                  id={group.monthId}
                  data-month-id={group.monthId}
                  ref={(el) => { monthRefs.current[group.monthId] = el; }}
                >
                  <h3 className="mb-5 w-full rounded-[9999px] bg-[#9b75f6] px-8 py-2.5 text-center text-2xl font-bold text-white">{group.month}</h3>
                  <div className="space-y-5">
                    {group.events.map((evt, idx) => (
                      <div
                        key={idx}
                        data-component="card"
                        className="flex flex-col gap-4 rounded-2xl border-[3px] border-[#a7abb3] bg-[#202124] px-8 py-6 md:grid md:grid-cols-[1fr_180px_170px] md:items-center"
                      >
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold leading-snug text-white">{evt.title}</h4>
                          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/55">{evt.lang}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{evt.date}</p>
                          <p className="mt-2 text-lg uppercase text-white/55">Virtual</p>
                        </div>
                        <Link
                          href="#"
                          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-black px-7 py-3 text-lg font-medium text-white/70 transition-colors hover:text-white"
                        >
                          Register Now
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Past Events ===== */}
      <section id="past-events" data-component="section" className="w-full bg-black py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-4 text-center text-2xl font-bold text-[#f58220]">Recorded Sessions</p>
          <h2 className="mb-16 text-center text-[58px] font-bold tracking-tight text-white">Past Events</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PAST_VIDEOS.map((video, idx) => (
              <div key={idx} data-component="card" className="group cursor-pointer">
                <div className="relative mb-5 overflow-hidden rounded-xl bg-[#1a1a24]">
                  <img
                    src={video.src}
                    alt={video.title}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                      <svg className="h-5 w-5 text-[#0a0a0f]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{video.lang}</p>
                <h4 className="text-lg font-medium text-white/90">{video.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer data-component="footer" className="w-full bg-black py-16">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 md:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-semibold text-white">Google Developer Experts</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white">
              AI Learning Labs Live is a series of hands-on developer events led by Google Developer Experts and focused on building practical AI applications.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end md:text-right">
            <Link href="https://developers.google.com/community/build-with-ai" className="text-sm text-white hover:text-white/70">
              Build with AI
            </Link>
            <Link href="https://developers.google.com/community/experts" className="text-sm text-white hover:text-white/70">
              Google Developer Experts
            </Link>
            <Link href="https://developers.google.com/programs" className="text-sm text-white hover:text-white/70">
              Developer Programs
            </Link>
            <Link href="https://policies.google.com/privacy" className="text-sm text-white hover:text-white/70">
              Privacy
            </Link>
            <Link href="https://policies.google.com/terms" className="text-sm text-white hover:text-white/70">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
