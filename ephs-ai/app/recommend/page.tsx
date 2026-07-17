import { redirect } from "next/navigation";

/** The recommender was replaced by the EPHS AI Assistant chat. */
export default function RecommendPage() {
  redirect("/chat");
}
