import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Play } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

interface SequenceEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess?: () => void;
}

export function SequenceEnrollmentDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: SequenceEnrollmentDialogProps) {
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: sequences = [] } = trpc.sequences.list.useQuery();

  const enrollPeople = trpc.sequences.enrollPeople.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      toast.success(`Enrolled ${selectedIds.length} contact(s) in sequence`);
      setSelectedSequenceId(null);
    },
    onError: (error) => {
      toast.error(`Failed to enroll: ${error.message}`);
    },
  });

  const handleEnroll = () => {
    if (!selectedSequenceId) return;
    enrollPeople.mutate({ personIds: selectedIds, sequenceId: selectedSequenceId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enroll in Sequence</DialogTitle>
          <DialogDescription>
            Enroll {selectedIds.length} selected contact(s) in an email sequence for automated outreach.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Email Sequence</Label>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {sequences.map((sequence) => (
                <button
                  key={sequence.id}
                  type="button"
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors hover:bg-accent text-left ${
                    selectedSequenceId === sequence.id
                      ? "border-primary bg-accent"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedSequenceId(sequence.id)}
                >
                  <div className="p-2 bg-primary/10 rounded-lg mt-1">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold">{sequence.name}</h4>
                      <Badge className={getStatusColor(sequence.status)}>
                        {sequence.status}
                      </Badge>
                    </div>
                    {sequence.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {sequence.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              {sequences.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No email sequences found. Create a sequence first to enroll contacts.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedSequenceId || enrollPeople.isPending}
          >
            {enrollPeople.isPending ? (
              "Enrolling..."
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Enroll in Sequence
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
