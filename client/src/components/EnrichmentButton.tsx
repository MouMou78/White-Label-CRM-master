import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnrichmentButtonProps {
  personId: string;
  person: any;
}

export function EnrichmentButton({ personId, person }: EnrichmentButtonProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const enrichMutation = trpc.people.enrich.useMutation();
  const utils = trpc.useUtils();

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const result = await enrichMutation.mutateAsync({ personId });
      
      if (result.success && result.enrichedFields.length > 0) {
        toast.success(`Enriched ${result.enrichedFields.length} field(s)`, {
          description: `Updated: ${result.enrichedFields.join(", ")}`,
        });
        // Refresh person data
        utils.people.get.invalidate({ id: personId });
      } else if (result.success && result.enrichedFields.length === 0) {
        toast.info("Contact already has complete information");
      } else {
        toast.error("Enrichment failed", {
          description: result.error || "Unable to find additional information",
        });
      }
    } catch (error: any) {
      toast.error("Enrichment failed", {
        description: error.message || "An error occurred during enrichment",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  // Show enrichment status
  const getEnrichmentStatus = () => {
    if (!person.enrichmentLastSyncedAt) {
      return { icon: Sparkles, color: "text-muted-foreground", tooltip: "Not enriched yet" };
    }
    
    if (person.enrichmentSource === "failed") {
      return { icon: XCircle, color: "text-destructive", tooltip: "Last enrichment failed" };
    }
    
    const daysSince = (Date.now() - new Date(person.enrichmentLastSyncedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      return { icon: CheckCircle2, color: "text-green-600", tooltip: `Enriched ${Math.floor(daysSince)} days ago` };
    }
    
    return { icon: Sparkles, color: "text-muted-foreground", tooltip: "Enrichment data may be outdated" };
  };

  const status = getEnrichmentStatus();
  const StatusIcon = status.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnrich}
            disabled={isEnriching}
            className="h-8 px-2"
          >
            {isEnriching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
            )}
            <span className="ml-1.5 text-xs">Enrich</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status.tooltip}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to fetch latest information
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
