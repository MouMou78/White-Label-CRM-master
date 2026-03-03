import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApolloEnrichButtonProps {
  personId: string;
}

// Apollo logo as a simple SVG inline component
function ApolloIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z" />
    </svg>
  );
}

export function ApolloEnrichButton({ personId }: ApolloEnrichButtonProps) {
  const utils = trpc.useUtils();

  const enrichMutation = trpc.integrations.apolloEnrichPerson.useMutation({
    onSuccess: (result: any) => {
      if (result?.success) {
        toast.success("Enriched from Apollo.io", {
          description: "Contact data updated with latest Apollo information.",
        });
        utils.people.get.invalidate({ id: personId });
      } else {
        toast.info("No additional data found in Apollo.io");
      }
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("not connected")) {
        toast.error("Apollo.io not connected", {
          description: "Go to Settings → Integrations to connect your Apollo.io account.",
        });
      } else if (msg.includes("not found")) {
        toast.info("Person not found in Apollo.io", {
          description: "No matching contact was found in your Apollo.io account.",
        });
      } else {
        toast.error("Apollo enrichment failed", {
          description: msg || "An error occurred during enrichment.",
        });
      }
    },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => enrichMutation.mutate({ personId })}
            disabled={enrichMutation.isPending}
            className="h-8 px-2 text-[#6366f1] hover:text-[#6366f1] hover:bg-[#6366f1]/10"
          >
            {enrichMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ApolloIcon className="h-4 w-4" />
            )}
            <span className="ml-1.5 text-xs">Apollo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Enrich from Apollo.io</p>
          <p className="text-xs text-muted-foreground mt-1">
            Fetch latest title, company, phone & LinkedIn from Apollo
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
