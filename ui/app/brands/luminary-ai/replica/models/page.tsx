import { redirect } from "next/navigation";

export default function ModelsHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/luminary-ai/preview/models");
}
