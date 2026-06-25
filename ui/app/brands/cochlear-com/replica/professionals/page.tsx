import { redirect } from "next/navigation";

export default function ProfessionalsHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/cochlear-com/preview/professionals");
}
