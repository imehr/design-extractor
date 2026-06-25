"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LuminaryHeader } from "@/components/brands/luminary-ai/luminary-ai-header";
import { LuminaryFooter } from "@/components/brands/luminary-ai/luminary-ai-footer";
import { ChevronDown, Share2 } from "lucide-react";

const DEMO_MODELS = ["Wing", "SUV", "Missile", "Submarine", "Pump"];

export default function DemoPage() {
  const [selectedModel, setSelectedModel] = useState("Wing");
  const [showSignup, setShowSignup] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(8.5);
  const [sweepAngle, setSweepAngle] = useState(28.57);
  const [rootTwist, setRootTwist] = useState(4.71);
  const [mach, setMach] = useState(0.6);

  return (
    <div className="min-h-screen bg-[#0f1215] text-[#f4f4f7]" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <LuminaryHeader />

      {/* Demo App Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0f1215] px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Image
            src="/brands/luminary-ai/b68bb8753b1ca3351a5b.svg"
            alt="Luminary Logo"
            width={24}
            height={24}
            className="shrink-0"
          />
          <span className="text-sm font-medium text-[#f4f4f7]">Prediction Demo</span>
          <Link
            href="https://luminarycloud.com/blog/luminary-launches-new-physics-ai-prediction-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-[#6e56e6] transition-colors hover:text-[#9f8efb] md:inline"
          >
            Learn how this works
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="flex items-center gap-2 rounded-md border border-white/10 bg-[#2a2b30] px-3 py-1.5 text-sm text-[#f4f4f7] transition-colors hover:bg-[#2f3034]">
              {selectedModel}
              <ChevronDown className="size-4 text-[#88898d]" />
            </button>
          </div>
          <button className="hidden rounded-md bg-[#2a2b30] px-3 py-1.5 text-sm text-[#f4f4f7] transition-colors hover:bg-[#2f3034] md:inline">
            Talk to Sales
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-[#2a2b30] px-3 py-1.5 text-sm text-[#f4f4f7] transition-colors hover:bg-[#2f3034]">
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="rounded-md bg-[#6e56e6] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#5a45c7]">
            Try Luminary Cloud
          </button>
        </div>
      </header>

      {/* Demo Canvas Area */}
      <main className="relative flex h-[calc(100vh-140px)] items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f1215] to-[#1a1c20]">
        {/* Watermark */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium tracking-wide text-white/30">
          Powered by Physics AI
        </div>

        {/* 3D Visualization Placeholder */}
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="relative aspect-video w-full max-w-4xl">
            <Image
              src="/brands/luminary-ai/1e7a5d4392c8dc0d6746.png"
              alt="Intro Header"
              fill
              className="object-contain opacity-80"
              priority
            />
          </div>
        </div>

        {/* Left Parameters Panel */}
        <div className="absolute left-4 top-4 hidden w-[280px] flex-col gap-4 rounded-lg border border-white/10 bg-[#2a2b30]/90 p-4 backdrop-blur-sm lg:flex">
          <h3 className="text-sm font-semibold text-[#f4f4f7]">Parameters</h3>

          <div className="flex flex-col gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#88898d]">Geometry</div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#c7c7ca]">Aspect Ratio</label>
                <span className="text-xs font-mono text-[#f4f4f7]">{aspectRatio.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="0.1"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(parseFloat(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#3a3b40] accent-[#6e56e6]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#c7c7ca]">Quarter Chord Sweep Angle</label>
                <span className="text-xs font-mono text-[#f4f4f7]">{sweepAngle.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="0.1"
                value={sweepAngle}
                onChange={(e) => setSweepAngle(parseFloat(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#3a3b40] accent-[#6e56e6]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#c7c7ca]">Root Twist</label>
                <span className="text-xs font-mono text-[#f4f4f7]">{rootTwist.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="15"
                step="0.1"
                value={rootTwist}
                onChange={(e) => setRootTwist(parseFloat(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#3a3b40] accent-[#6e56e6]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#88898d]">Flow Conditions</div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#c7c7ca]">Mach</label>
                <span className="text-xs font-mono text-[#f4f4f7]">{mach.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.2"
                step="0.01"
                value={mach}
                onChange={(e) => setMach(parseFloat(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#3a3b40] accent-[#6e56e6]"
              />
            </div>
          </div>

          <button className="mt-2 flex h-12 w-full items-center justify-center rounded-md bg-[#6e56e6] text-sm font-semibold text-white transition-colors hover:bg-[#5a45c7]">
            Predict
          </button>
        </div>

        {/* Right Outputs Panel */}
        <div className="absolute right-4 top-4 hidden w-[280px] flex-col gap-4 rounded-lg border border-white/10 bg-[#2a2b30]/90 p-4 backdrop-blur-sm lg:flex">
          <h3 className="text-sm font-semibold text-[#f4f4f7]">Outputs</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-[#88898d]">Cd</span>
              <span className="text-xs font-mono text-[#f4f4f7]">—</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-[#88898d]">Cl</span>
              <span className="text-xs font-mono text-[#f4f4f7]">—</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-[#88898d]">L/D</span>
              <span className="text-xs font-mono text-[#f4f4f7]">—</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-[#88898d]">Cm</span>
              <span className="text-xs font-mono text-[#f4f4f7]">—</span>
            </div>
          </div>
          <p className="text-xs text-[#88898d]">Press Predict to compute aerodynamic coefficients.</p>
        </div>
      </main>

      {/* Mobile Controls */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#2a2b30] p-4 lg:hidden">
        <button className="flex h-12 w-full items-center justify-center rounded-md bg-[#6e56e6] text-sm font-semibold text-white transition-colors hover:bg-[#5a45c7]">
          Predict
        </button>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#2a2b30] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-[#f4f4f7]">Experience Physics AI model predictions firsthand</h2>
            <p className="mt-2 text-sm text-[#88898d]">Please share your contact details to try out our demo</p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="mb-1 block text-xs text-[#c7c7ca]">First Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-white/10 bg-[#1a1c20] px-3 py-2 text-sm text-[#f4f4f7] placeholder:text-[#88898d] focus:border-[#6e56e6] focus:outline-none"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#c7c7ca]">Last Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-white/10 bg-[#1a1c20] px-3 py-2 text-sm text-[#f4f4f7] placeholder:text-[#88898d] focus:border-[#6e56e6] focus:outline-none"
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#c7c7ca]">Business Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-white/10 bg-[#1a1c20] px-3 py-2 text-sm text-[#f4f4f7] placeholder:text-[#88898d] focus:border-[#6e56e6] focus:outline-none"
                  placeholder="Business Email"
                />
              </div>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5 size-4 rounded border-white/10 bg-[#1a1c20] accent-[#6e56e6]" />
                <span className="text-xs text-[#88898d]">Sign me up to receive the Luminary Newsletter to stay up to date</span>
              </label>
              <p className="text-xs text-[#88898d]">
                We will process your information in accordance with our{" "}
                <Link href="#" className="text-[#6e56e6] hover:text-[#9f8efb]">
                  Privacy Policy
                </Link>
              </p>
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-md bg-[#6e56e6] text-sm font-semibold text-white transition-colors hover:bg-[#5a45c7]"
              >
                Let&apos;s Go
              </button>
            </form>
          </div>
        </div>
      )}

      <LuminaryFooter />
    </div>
  );
}
