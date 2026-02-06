import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Building2, User, Linkedin, Trash2, ExternalLink } from "lucide-react";
import { toast as showToast } from "sonner";

export default function AmplemarketLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("amplemarket");

  // Fetch leads with filters
  const { data: leads = [], isLoading, refetch } = trpc.amplemarket.listLeads.useQuery({
    ownerEmail: ownerFilter || undefined,
    source: sourceFilter || undefined,
    limit: 100,
  });

  // Delete lead mutation
  const deleteMutation = trpc.amplemarket.deleteLead.useMutation({
    onSuccess: () => {
      showToast.success("Lead deleted successfully");
      refetch();
    },
    onError: (error) => {
      showToast.error(`Delete failed: ${error.message}`);
    },
  });

  // Filter leads by search term (client-side)
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.email?.toLowerCase().includes(term) ||
      lead.firstName?.toLowerCase().includes(term) ||
      lead.lastName?.toLowerCase().includes(term) ||
      lead.company?.toLowerCase().includes(term)
    );
  });

  // Get unique owners for filter dropdown
  const uniqueOwners = Array.from(new Set(leads.map((l) => l.ownerEmail).filter((email): email is string => Boolean(email))));

  const handleDelete = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate({ leadId });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Amplemarket Leads</h1>
        <p className="text-muted-foreground">
          View and manage leads synced from Amplemarket lists. These are separate from your CRM contacts.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter leads by owner, source, or keyword</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All owners</SelectItem>
                {uniqueOwners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sources</SelectItem>
                <SelectItem value="amplemarket">Amplemarket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      {/* Leads list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No leads found. Try adjusting your filters or sync leads from Amplemarket.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unknown"}
                      </h3>
                      <Badge variant="outline">{lead.source}</Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground">
                      {lead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${lead.email}`} className="hover:text-foreground">
                            {lead.email}
                          </a>
                        </div>
                      )}

                      {lead.company && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{lead.company}</span>
                          {lead.title && <span className="text-xs">• {lead.title}</span>}
                        </div>
                      )}

                      {lead.ownerEmail && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Owner: {lead.ownerEmail}</span>
                        </div>
                      )}

                      {lead.linkedinUrl && (
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground flex items-center gap-1"
                          >
                            LinkedIn Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {lead.syncedAt && (
                        <div className="text-xs">
                          Synced: {new Date(lead.syncedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(lead.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
