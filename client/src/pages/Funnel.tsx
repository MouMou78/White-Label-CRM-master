import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const stageLabels: Record<string, string> = {
  prospected: "Prospected",
  engaged: "Engaged",
  active: "Active",
  waiting: "Waiting",
  dormant: "Dormant",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const stageColors: Record<string, string> = {
  prospected: "bg-slate-100 text-slate-800",
  engaged: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  waiting: "bg-yellow-100 text-yellow-800",
  dormant: "bg-gray-100 text-gray-800",
  closed_won: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-red-100 text-red-800",
};

export default function Funnel() {
  const { data, isLoading, error } = trpc.funnel.get.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-8">
          Error loading funnel: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Funnel</h1>
          <p className="text-muted-foreground">
            Visualize your pipeline and track deals through each stage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {data?.stages.map((stage) => (
            <Card key={stage.stage_key} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stageLabels[stage.stage_key] || stage.stage_key}
                  <Badge variant="secondary" className="ml-2">
                    {stage.threads.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {stage.threads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No threads
                  </p>
                ) : (
                  stage.threads.map((thread) => (
                    <Card
                      key={thread.thread_id}
                      className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {thread.person?.full_name || "Unknown"}
                        </p>
                        {thread.person?.company_name && (
                          <p className="text-xs text-muted-foreground">
                            {thread.person.company_name}
                          </p>
                        )}
                        {thread.next_action && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${stageColors[stage.stage_key]}`}
                          >
                            {thread.next_action.action_type}
                          </Badge>
                        )}
                        {thread.last_activity_at && (
                          <p className="text-xs text-muted-foreground">
                            Last: {new Date(thread.last_activity_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
