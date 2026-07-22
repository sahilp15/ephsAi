import { redirect } from "next/navigation";

/** The recommender was replaced by the EPHS Student Helper chat. */
export default function RecommendPage() {
  redirect("/chat");
}
