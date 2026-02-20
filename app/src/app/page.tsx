import type { Metadata } from "next";
import { HomePageClient } from "./components/HomePageClient";

export const metadata: Metadata = {
  title: "Linopress — AI WordPress Builder",
  description:
    "Describe your website and let Linopress generate, validate, and iterate your WordPress build.",
};

export default function Home() {
  return <HomePageClient />;
}
