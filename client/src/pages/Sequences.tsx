import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Mail, Play, Pause, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Sequences() {
  const { data: sequences, isLoading } = trpc.sequences.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mockSequences = [
    {
      id: "seq-1",
      name: "Outbound Sales Sequence",
      description: "5-step sequence for cold outreach",
      status: "active",
      stepCount: 5,
      enrolledCount: 24,
      openRate: 45,
      replyRate: 12,
    },
    {
      id: "seq-2",
      name: "Product Demo Follow-up",
      description: "3-step follow-up after demo",
      status: "active",
      stepCount: 3,
      enrolledCount: 12,
      openRate: 68,
      replyRate: 28,
    },
    {
      id: "seq-3",
      name: "Re-engagement Campaign",
      description: "Win back dormant leads",
      status: "paused",
      stepCount: 4,
      enrolledCount: 8,
      openRate: 32,
      replyRate: 8,
    },
  ];

  const allSequences = [...mockSequences, ...(sequences || [])];

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Email Sequences</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Create and manage multi-step email campaigns
          </p>
        </div>
        <Link href="/sequences/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Sequence
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {allSequences.map((sequence) => (
          <Card key={sequence.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 w-full sm:w-auto">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{sequence.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-1">
                      {sequence.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge variant={sequence.status === "active" ? "default" : "secondary"}>
                    {sequence.status === "active" ? (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Paused
                      </>
                    )}
                  </Badge>
                  <Link href={`/sequences/${sequence.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Steps</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">{sequence.stepCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">{sequence.enrolledCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-semibold">{sequence.openRate}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Reply Rate</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-semibold">{sequence.replyRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allSequences.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No email sequences yet</p>
            <Link href="/sequences/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Sequence
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
