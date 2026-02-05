import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TagManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  entityType: "people" | "accounts";
  onSuccess?: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function TagManagementDialog({
  open,
  onOpenChange,
  selectedIds,
  entityType,
  onSuccess,
}: TagManagementDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [showNewTagForm, setShowNewTagForm] = useState(false);

  const utils = trpc.useUtils();
  const { data: tags = [] } = trpc.tags.list.useQuery();

  const createTag = trpc.tags.create.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      setNewTagName("");
      setShowNewTagForm(false);
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });

  const addToPeople = trpc.tags.addToPeople.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      toast.success(`Tagged ${selectedIds.length} contact(s)`);
    },
    onError: (error) => {
      toast.error(`Failed to add tags: ${error.message}`);
    },
  });

  const addToAccounts = trpc.tags.addToAccounts.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      onSuccess?.();
      onOpenChange(false);
      toast.success(`Tagged ${selectedIds.length} account(s)`);
    },
    onError: (error) => {
      toast.error(`Failed to add tags: ${error.message}`);
    },
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag.mutate({ name: newTagName.trim(), color: selectedColor });
  };

  const handleApplyTag = (tagId: string) => {
    if (entityType === "people") {
      addToPeople.mutate({ personIds: selectedIds, tagId });
    } else {
      addToAccounts.mutate({ accountIds: selectedIds, tagId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Tags</DialogTitle>
          <DialogDescription>
            Select existing tags or create a new one to apply to {selectedIds.length} selected {entityType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Tags */}
          <div className="space-y-2">
            <Label>Select Tag</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  className="cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: tag.color || "#3b82f6" }}
                  onClick={() => handleApplyTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags yet. Create one below.</p>
              )}
            </div>
          </div>

          {/* Create New Tag */}
          {!showNewTagForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewTagForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Tag
            </Button>
          ) : (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label>New Tag</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewTagForm(false);
                    setNewTagName("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTag();
                }}
              />

              <div className="space-y-2">
                <Label className="text-sm">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTag.isPending}
                className="w-full"
              >
                {createTag.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
