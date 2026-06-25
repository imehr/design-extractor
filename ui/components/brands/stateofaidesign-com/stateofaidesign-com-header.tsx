"use client";

import Link from "next/link";
import { StateofaidesignLogo } from "./stateofaidesign-com-logo";
import { Plus } from "lucide-react";

export function StateofaidesignHeader() {
  return (
    <header
      data-component="nav"
      className="sticky top-0 z-50 flex h-14 items-center justify-between bg-white px-4"
    >
      {/* Logo */}
      <Link
        href="/brands/stateofaidesign-com/replica"
        className="flex h-8 items-center bg-black px-2 text-white"
      >
        <StateofaidesignLogo />
      </Link>

      {/* Center CTA */}
      <Link
        href="#"
        className="hidden items-center gap-1 rounded-sm bg-[#FF7A5C] px-4 py-2 text-sm font-medium text-black md:flex"
        style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
      >
        Read the Report
        <Plus className="size-3.5" />
      </Link>

      {/* Right nav */}
      <nav className="flex items-center gap-6 text-sm text-black">
        <Link href="/brands/stateofaidesign-com/replica/about" className="hover:opacity-70">
          About
        </Link>
        <Link href="#" className="flex items-center gap-0.5 hover:opacity-70">
          Case Studies
          <Plus className="size-3.5" />
        </Link>
      </nav>
    </header>
  );
}
