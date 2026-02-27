"use client";

import "@/lib/feedback-widget/index.css";
import { useAuth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mod = require("@/lib/feedback-widget/index.mjs") as any;
const FeedbackWidget = mod.FeedbackWidget as React.FC<{
  projectId: string;
  apiBaseUrl?: string;
  userEmail?: string;
  userName?: string;
}>;

export default function FeedbackWidgetWrapper() {
  const { user } = useAuth();

  return (
    <FeedbackWidget
      projectId="pk_cc65b4b8b85dd706a20d61938e539e79bcd576f91bbbf1c5"
      apiBaseUrl="https://saasmaker-api.sarthakagrawal927.workers.dev"
      userEmail={user?.email}
      userName={user?.name}
    />
  );
}
