import type { Metadata } from "next";
import ScheduleView from "@/components/ScheduleView";

export const metadata: Metadata = {
  title: "Schedule",
};

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan your anime watching calendar day by day
        </p>
      </div>
      <ScheduleView />
    </div>
  );
}
