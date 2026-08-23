"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface PendingApproval {
  approval_id: number;
  tool_id: string;
  args: Record<string, unknown>;
  reason: string;
}

export function ApprovalCard({ approval, onDecided }: { approval: PendingApproval; onDecided: () => void }) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const decide = async (decision: "approve" | "reject") => {
    setBusy(decision);
    try {
      await api.post(`/api/approvals/${approval.approval_id}/decide`, { decision });
      onDecided();
    } catch {
      // The SSE stream will surface any issue.
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-medium">Approval required</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{approval.reason}</p>
        <div className="mt-2 rounded-md bg-muted p-2 font-mono text-xs">
          <span className="text-muted-foreground">tool:</span> {approval.tool_id}
          {Object.keys(approval.args || {}).length > 0 && (
            <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">{JSON.stringify(approval.args, null, 2)}</pre>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => decide("approve")} disabled={!!busy}>
            {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1" />}
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => decide("reject")} disabled={!!busy}>
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}