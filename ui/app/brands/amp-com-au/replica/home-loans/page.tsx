import { redirect } from "next/navigation";

export default function HomeLoansHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/amp-com-au/preview/home-loans");
}
