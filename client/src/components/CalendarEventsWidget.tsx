import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, MapPin, Users, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function CalendarEventsWidget() {
  const { data: status } = trpc.calendar.getStatus.useQuery();
  const { data: events, isLoading, error } = trpc.calendar.getUpcomingEvents.useQuery(
    { maxResults: 5 },
    { enabled: status?.connected }
  );

  if (!status?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>Connect Google Calendar to see your upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/integrations">
            <Button variant="outline" className="w-full">
              Connect Google Calendar
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load calendar events. Try reconnecting your Google Calendar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>
          {status.lastSyncedAt
            ? `Last synced ${new Date(status.lastSyncedAt).toLocaleString()}`
            : "Your upcoming Google Calendar events"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => {
              const startTime = event.start.dateTime
                ? new Date(event.start.dateTime)
                : event.start.date
                ? new Date(event.start.date)
                : null;

              const endTime = event.end.dateTime
                ? new Date(event.end.dateTime)
                : event.end.date
                ? new Date(event.end.date)
                : null;

              const isToday = startTime && startTime.toDateString() === new Date().toDateString();
              const isTomorrow = startTime && startTime.toDateString() === new Date(Date.now() + 86400000).toDateString();

              return (
                <div
                  key={event.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium line-clamp-2">{event.summary}</h4>
                    {isToday && (
                      <Badge variant="default" className="flex-shrink-0">Today</Badge>
                    )}
                    {isTomorrow && (
                      <Badge variant="secondary" className="flex-shrink-0">Tomorrow</Badge>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {startTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {startTime.toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {endTime && ` - ${endTime.toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`}
                        </span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                  >
                    View in Google Calendar
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming events</p>
            <p className="text-sm mt-1">Your calendar is clear</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
