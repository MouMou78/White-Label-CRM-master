import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess?: () => void;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: AssignmentDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: teamMembers = [] } = trpc.assignment.getTeamMembers.useQuery();

  const assignPeople = trpc.assignment.assignPeople.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      toast.success(`Assigned ${selectedIds.length} contact(s)`);
      setSelectedUserId(null);
    },
    onError: (error) => {
      toast.error(`Failed to assign: ${error.message}`);
    },
  });

  const unassignPeople = trpc.assignment.unassignPeople.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      toast.success(`Unassigned ${selectedIds.length} contact(s)`);
    },
    onError: (error) => {
      toast.error(`Failed to unassign: ${error.message}`);
    },
  });

  const handleAssign = () => {
    if (!selectedUserId) return;
    assignPeople.mutate({ personIds: selectedIds, userId: selectedUserId });
  };

  const handleUnassign = () => {
    unassignPeople.mutate({ personIds: selectedIds });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Contacts</DialogTitle>
          <DialogDescription>
            Assign {selectedIds.length} selected contact(s) to a team member for ownership tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Team Member</Label>
            <div className="grid gap-2">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors hover:bg-accent ${
                    selectedUserId === member.id
                      ? "border-primary bg-accent"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedUserId(member.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{member.name || "Unnamed User"}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {member.role && (
                    <span className="text-xs px-2 py-1 rounded bg-muted">
                      {member.role}
                    </span>
                  )}
                </button>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team members found. Invite team members to assign contacts.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleUnassign}
            disabled={unassignPeople.isPending}
            className="w-full sm:w-auto"
          >
            {unassignPeople.isPending ? "Unassigning..." : "Remove Assignment"}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || assignPeople.isPending}
              className="flex-1"
            >
              {assignPeople.isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
