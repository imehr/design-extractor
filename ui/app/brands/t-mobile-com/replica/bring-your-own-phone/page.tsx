import { redirect } from "next/navigation";

export default function BringYourOwnPhoneHtmlSnapshotReplica() {
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/t-mobile-com/preview/bring-your-own-phone");
}
