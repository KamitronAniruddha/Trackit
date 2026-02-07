
import { RevisionsClient } from "@/components/revisions-client";

export default function RevisionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revision Hub</h1>
        <p className="text-muted-foreground">
          Track your subject revisions and generate AI-powered study plans for completed subjects.
        </p>
      </div>
      <RevisionsClient />
    </div>
  );
}
