import { redirect } from "next/navigation";

export default function MakeAPaymentHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/rac-com-au/preview/make-a-payment");
}
