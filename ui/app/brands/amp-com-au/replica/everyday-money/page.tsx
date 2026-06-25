import { redirect } from "next/navigation";

export default function EverydayMoneyHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/amp-com-au/preview/everyday-money");
}
