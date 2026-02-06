import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Search, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function WebhookMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "processed" | "failed" | "pending">("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: events, isLoading, refetch } = trpc.webhooks.listEvents.useQuery({
    limit: 50,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: stats } = trpc.webhooks.getStats.useQuery();

  const filteredEvents = events?.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.provider.toLowerCase().includes(query) ||
      event.eventType.toLowerCase().includes(query) ||
      JSON.stringify(event.payload).toLowerCase().includes(query)
    );
  });

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webhook Monitor</h1>
        <p className="text-muted-foreground mt-2">
          Track and debug incoming webhook events from integrations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.processed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? Math.round((stats.processed / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by provider, type, or payload..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Events List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              {filteredEvents?.length || 0} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedEvent?.id === event.id
                        ? "border-primary bg-accent"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {event.provider}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {event.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {event.processedAt ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : event.error ? (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No webhook events found</p>
                <p className="text-sm mt-2">Events will appear here when webhooks are received</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              {selectedEvent ? `Event ID: ${selectedEvent.id}` : "Select an event to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                {selectedEvent.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{selectedEvent.error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <h4 className="text-sm font-semibold mb-2">Status</h4>
                  <div className="flex items-center gap-2">
                    {selectedEvent.processedAt ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          Processed at {new Date(selectedEvent.processedAt).toLocaleString()}
                        </span>
                      </>
                    ) : selectedEvent.error ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Failed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Pending</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Payload</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Headers</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-[150px] overflow-y-auto">
                    {JSON.stringify(selectedEvent.headers, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select an event from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
