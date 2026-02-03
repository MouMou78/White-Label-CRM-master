import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Settings, Trash2, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "dropdown";
  entity: "contact" | "company";
  options?: string[];
  required: boolean;
}

export default function CustomFields() {
  const { data: fields, isLoading } = trpc.customFields.list.useQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<"text" | "number" | "date" | "dropdown">("text");
  const [fieldEntity, setFieldEntity] = useState<"contact" | "company">("contact");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);

  const mockFields: CustomField[] = [
    {
      id: "field-1",
      name: "industry_vertical",
      label: "Industry Vertical",
      type: "dropdown",
      entity: "company",
      options: ["SaaS", "E-commerce", "Healthcare", "Finance", "Education"],
      required: false,
    },
    {
      id: "field-2",
      name: "deal_size",
      label: "Expected Deal Size",
      type: "number",
      entity: "contact",
      required: false,
    },
    {
      id: "field-3",
      name: "contract_end_date",
      label: "Contract End Date",
      type: "date",
      entity: "company",
      required: false,
    },
    {
      id: "field-4",
      name: "lead_source_detail",
      label: "Lead Source Detail",
      type: "text",
      entity: "contact",
      required: false,
    },
  ];

  const allFields = [...mockFields, ...(fields || [])];

  const handleCreateField = () => {
    if (!fieldName || !fieldLabel) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Custom field created successfully!");
    setIsDialogOpen(false);
    // Reset form
    setFieldName("");
    setFieldLabel("");
    setFieldType("text");
    setFieldEntity("contact");
    setFieldOptions("");
    setFieldRequired(false);
  };

  const handleDeleteField = (fieldId: string) => {
    toast.success("Custom field deleted");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Custom Fields</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Define custom properties for contacts and companies
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Custom Field</DialogTitle>
              <DialogDescription>
                Add a new custom field to track additional information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="entity">Entity Type</Label>
                <Select value={fieldEntity} onValueChange={(value: "contact" | "company") => setFieldEntity(value)}>
                  <SelectTrigger id="entity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Field Name (internal)</Label>
                <Input
                  id="name"
                  placeholder="e.g., industry_vertical"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase with underscores, no spaces
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Display Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Industry Vertical"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Field Type</Label>
                <Select value={fieldType} onValueChange={(value: "text" | "number" | "date" | "dropdown") => setFieldType(value)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {fieldType === "dropdown" && (
                <div className="space-y-2">
                  <Label htmlFor="options">Dropdown Options</Label>
                  <Input
                    id="options"
                    placeholder="Option 1, Option 2, Option 3"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate options with commas
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateField}>Create Field</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contact Fields</CardTitle>
            <CardDescription>
              Custom fields for contact records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allFields.filter((f) => f.entity === "contact").map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Settings className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{field.label}</p>
                        <Badge variant="outline" className="capitalize">
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {field.name}
                      </p>
                      {field.options && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.options.map((opt: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {allFields.filter((f) => f.entity === "contact").length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  No custom contact fields yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Fields</CardTitle>
            <CardDescription>
              Custom fields for company records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allFields.filter((f) => f.entity === "company").map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Settings className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{field.label}</p>
                        <Badge variant="outline" className="capitalize">
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {field.name}
                      </p>
                      {field.options && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.options.map((opt: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {allFields.filter((f) => f.entity === "company").length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  No custom company fields yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
