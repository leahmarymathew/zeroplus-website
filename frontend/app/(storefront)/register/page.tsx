import { redirect } from "next/navigation";

// /login and /register are one screen in the design (tab-toggle card) —
// this route just lands on that screen with the Register tab active.
export default function RegisterPage() {
  redirect("/login?tab=register");
}
