import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SavedFiltersProps {
  viewType: "deals" | "contacts" | "accounts" | "tasks";
  currentFilters: Record<string, any>;
  currentSort?: { sortBy: string; sortOrder: "asc" | "desc" };
  onApplyFilter: (filter: any) => void;
}

export function SavedFilters({
  viewType,
  currentFilters,
  currentSort,
  onApplyFilter,
}: SavedFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const utils = trpc.useUtils();
  const { data: savedFilters = [] } = trpc.savedFilters.list.useQuery({ viewType });

  const createFilterMutation = trpc.savedFilters.create.useMutation({
    onSuccess: () => {
      utils.savedFilters.list.invalidate({ viewType });
      toast.success("Filter saved successfully!");
      setShowSaveDialog(false);
      setFilterName("");
      setIsPublic(false);
    },
    onError: (error) => {
      toast.error(`Failed to save filter: ${error.message}`);
    },
  });

  const deleteFilterMutation = trpc.savedFilters.delete.useMutation({
    onSuccess: () => {
      utils.savedFilters.list.invalidate({ viewType });
      toast.success("Filter deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete filter: ${error.message}`);
    },
  });

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    createFilterMutation.mutate({
      name: filterName,
      viewType,
      filters: currentFilters,
      sortBy: currentSort?.sortBy,
      sortOrder: currentSort?.sortOrder,
      isPublic,
    });
  };

  const handleDeleteFilter = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this filter?")) {
      deleteFilterMutation.mutate({ filterId });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Saved Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Your Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedFilters.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No saved filters yet
            </div>
          ) : (
            savedFilters.map((filter: any) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => onApplyFilter(filter)}
                className="flex items-center justify-between"
              >
                <span className="flex-1">{filter.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => handleDeleteFilter(filter.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter settings for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                placeholder="e.g., Hot Leads in California"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <Label htmlFor="is-public" className="text-sm font-normal">
                Share with team (visible to all team members)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFilter}
              disabled={createFilterMutation.isPending}
            >
              {createFilterMutation.isPending ? "Saving..." : "Save Filter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
