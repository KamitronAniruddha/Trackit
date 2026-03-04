
import { RevisionsClient } from "@/components/revisions-client";

export default function RevisionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground -mt-4">
        Track your subject revisions and generate AI-powered study plans for completed subjects.
      </p>
      <RevisionsClient />
    </div>
  );
}
