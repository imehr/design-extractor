import { redirect } from "next/navigation";

export default function FindABranchHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/rac-com-au/preview/find-a-branch");
}
