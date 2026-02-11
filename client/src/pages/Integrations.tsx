import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, CheckCircle2, XCircle, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Integrations() {
  const { data: integrations, isLoading, refetch } = trpc.integrations.list.useQuery();
  
  // Handle OAuth callback messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('google_connected') === 'true') {
      toast.success('Google Calendar connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
      refetch();
    } else if (params.get('google_error')) {
      const error = params.get('google_error');
      if (error === 'access_denied') {
        toast.error('Google Calendar connection cancelled');
      } else if (error === 'no_refresh_token') {
        toast.error('Please revoke access in your Google account settings and try again');
      } else {
        toast.error('Failed to connect Google Calendar');
      }
      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    }
  }, [refetch]);
  
  const [apolloKey, setApolloKey] = useState("");

  const connectApollo = trpc.integrations.connectApollo.useMutation({
    onSuccess: () => {
      toast.success("Apollo.io connected successfully");
      setApolloKey("");
      refetch();
    },
    onError: () => {
      toast.error("Failed to connect Apollo.io");
    },
  });
  
  const handleConnectApollo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apolloKey.trim()) return;
    
    await connectApollo.mutateAsync({ apiKey: apolloKey });
  };

  const googleIntegration = integrations?.find((i) => i.provider === "google");
  const whatsappIntegration = integrations?.find((i) => i.provider === "whatsapp");
  const apolloIntegration = integrations?.find((i) => i.provider === "apollo");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect external services to sync data automatically
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/sync-history">View Sync History</a>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Workspace</CardTitle>
                  <CardDescription>Gmail and Calendar sync</CardDescription>
                </div>
                {googleIntegration?.status === "connected" ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Automatically sync emails and calendar events from your Google Workspace account.
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Gmail email tracking</li>
                    <li>Calendar meeting sync</li>
                    <li>Automatic moment creation</li>
                  </ul>
                </div>

                {googleIntegration?.status === "connected" ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => toast.success("Google Workspace already connected and syncing")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Connected & Syncing
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      // Tenant ID will be retrieved from session on the backend
                      window.location.href = `/api/oauth/google`;
                    }}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect Google Workspace
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Apollo.io</CardTitle>
                  <CardDescription>Contact enrichment and sync</CardDescription>
                </div>
                {apolloIntegration?.status === "connected" ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sync contacts and enrich people data from Apollo.io.
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Contact sync from Apollo</li>
                    <li>Data enrichment (title, company, phone)</li>
                    <li>LinkedIn profile matching</li>
                    <li>Engagement tracking</li>
                  </ul>
                </div>

                {apolloIntegration?.status === "connected" ? (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => syncApolloContacts.mutate()}
                      disabled={syncApolloContacts.isPending}
                    >
                      {syncApolloContacts.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Sync Contacts
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => syncApolloEngagements.mutate()}
                      disabled={syncApolloEngagements.isPending}
                    >
                      {syncApolloEngagements.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Sync Engagements (Calls & Emails)
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleConnectApollo} className="space-y-3">
                    <div>
                      <Label htmlFor="apollo-key">API Key</Label>
                      <Input
                        id="apollo-key"
                        type="password"
                        placeholder="Enter your Apollo.io API key"
                        value={apolloKey}
                        onChange={(e) => setApolloKey(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={connectApollo.isPending}
                    >
                      {connectApollo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Connect Apollo.io
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>WhatsApp Business</CardTitle>
                  <CardDescription>WhatsApp message sync</CardDescription>
                </div>
                {whatsappIntegration?.status === "connected" ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sync WhatsApp Business conversations directly into your CRM as moments.
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Message sync (incoming/outgoing)</li>
                    <li>Automatic moment creation</li>
                    <li>Send messages from CRM</li>
                    <li>Conversation threading</li>
                  </ul>
                </div>

                <Button className="w-full" variant="outline" disabled>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect WhatsApp (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
