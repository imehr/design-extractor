import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const steps = [
  "Launch the UI with `/design-extractor:browse` and open the Library.",
  "Pick a brand or run `/design-extractor:extract <url>` from Claude Code to create a new one.",
  "Open the brand detail page and inspect Overview, Tokens, Replica, and Validation.",
  "On the Validation tab, press `Improve Quality` to start a local improvement job.",
  "If the source site blocks automated browsing, follow the assisted-capture steps and re-run the job.",
  "When you have feedback, use `/design-extractor:learn-feedback <slug> <notes>` so the harness, skills, and agent prompts are updated for future runs.",
];


const architecture = [
  {
    title: "Hybrid runtime",
    body: "Tool-using extraction and validation live in local Python and Next.js control-plane code. MASFactory defines the harness contract, learning surfaces, and promotion rules.",
  },
  {
    title: "Single validation truth",
    body: "The UI now prefers `validation/report.json` for score and readiness. Metadata is synchronized from the live report after validation runs.",
  },
  {
    title: "Self-improvement loop",
    body: "Improvement jobs record score history, detect plateau, log feedback, and prepare the system for skill promotion only after harness validation passes.",
  },
  {
    title: "Blocked-site fallback",
    body: "When Akamai, EdgeSuite, or similar anti-bot protection blocks source capture, the system switches to assisted-capture mode instead of pretending the site is unsupported.",
  },
];


const learning = [
  "Feedback is written to `state/learning/feedback-log.jsonl`.",
  "The harness contract lives in `HARNESS.md` and the MASFactory scaffold lives in `blueprints/generated/design-extractor-runtime.json`.",
  "Promotion remains gated: learned skills should only auto-promote after harness validation passes.",
  "Westpac is the current stronger baseline; Woolworths is the stress case for blocked-site fallback and shared-component refinement.",
];


export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="max-w-3xl">
        <Badge variant="outline" className="mb-4">System Guide</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">
          How To Use The Design Extractor
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-[#6e6e73]">
          This guide covers the daily workflow, the MASFactory-aligned harness design,
          the blocked-site fallback, and the feedback loop that improves the system over time.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Step By Step</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-[#1d1d1f]">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl bg-[#f5f5f7] p-4 text-sm text-[#1d1d1f]">
              Start at the <Link href="/" className="font-medium text-[#0071e3] hover:underline">Library</Link>, then open a brand’s Validation tab to run improvement jobs.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Loop</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-[#1d1d1f]">
              {learning.map((item) => (
                <li key={item} className="rounded-lg border border-[#d2d2d7]/40 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {architecture.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[#6e6e73]">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
