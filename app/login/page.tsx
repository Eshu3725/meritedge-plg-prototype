import type { Metadata } from "next";
import { LoginScreen } from "./login-screen";

export const metadata: Metadata = {
  title: "TalentEdge",
  description: "An AI-Native Assessment Suite",
};

export default function LoginPage() {
  return <LoginScreen />;
}
