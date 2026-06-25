import { redirect } from "next/navigation";

export default function HomepageHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/rac-com-au/preview/homepage");
}
