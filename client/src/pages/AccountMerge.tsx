import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GitMerge, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccountMerge() {
  const [, setLocation] = useLocation();
  const [sourceId, setSourceId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [mergedFields, setMergedFields] = useState<Record<string, any>>({});

  const { data: accounts } = trpc.accounts.list.useQuery();
  const mergeMutation = trpc.accounts.merge.useMutation({
    onSuccess: () => {
      toast.success("Accounts merged successfully!");
      setLocation("/accounts");
    },
    onError: (error) => {
      toast.error(`Merge failed: ${error.message}`);
    },
  });

  const sourceAccount = accounts?.find(a => a.id === sourceId);
  const targetAccount = accounts?.find(a => a.id === targetId);

  const handleFieldSelection = (field: string, value: any) => {
    setMergedFields(prev => ({ ...prev, [field]: value }));
  };

  const handleMerge = () => {
    if (!sourceId || !targetId) {
      toast.error("Please select both source and target accounts");
      return;
    }

    if (sourceId === targetId) {
      toast.error("Source and target accounts cannot be the same");
      return;
    }

    mergeMutation.mutate({
      sourceId,
      targetId,
      mergedFields,
    });
  };

  const fields = ["name", "domain", "industry", "headquarters"];

  return (
    <div className="container max-w-6xl py-8">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link to="/accounts">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitMerge className="h-8 w-8" />
          Merge Accounts
        </h1>
        <p className="text-muted-foreground mt-2">
          Combine two duplicate accounts into one. All contacts and deals will be transferred.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Source Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Source Account</CardTitle>
            <CardDescription>This account will be deleted after merge</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.filter(a => a.id !== targetId).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Target Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Target Account</CardTitle>
            <CardDescription>This account will be kept and updated</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.filter(a => a.id !== sourceId).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Field Comparison */}
      {sourceAccount && targetAccount && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Field Comparison</CardTitle>
            <CardDescription>Choose which values to keep for each field</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field) => {
              const sourceValue = sourceAccount[field as keyof typeof sourceAccount] as string || "—";
              const targetValue = targetAccount[field as keyof typeof targetAccount] as string || "—";
              
              if (sourceValue === targetValue) return null;

              return (
                <div key={field} className="border-b pb-4 last:border-0">
                  <Label className="text-base font-semibold capitalize mb-3 block">{field}</Label>
                  <RadioGroup
                    value={mergedFields[field] || targetValue}
                    onValueChange={(value) => handleFieldSelection(field, value)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value={sourceValue} id={`source-${field}`} />
                      <Label htmlFor={`source-${field}`} className="flex-1 cursor-pointer">
                        <span className="text-sm text-muted-foreground">Source: </span>
                        <span className="font-medium">{sourceValue}</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={targetValue} id={`target-${field}`} />
                      <Label htmlFor={`target-${field}`} className="flex-1 cursor-pointer">
                        <span className="text-sm text-muted-foreground">Target: </span>
                        <span className="font-medium">{targetValue}</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Warning and Action */}
      {sourceAccount && targetAccount && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              This action cannot be undone. The source account <strong>{sourceAccount.name}</strong> will be permanently deleted,
              and all its contacts and deals will be transferred to <strong>{targetAccount.name}</strong>.
            </p>
            <Button
              onClick={handleMerge}
              disabled={mergeMutation.isPending}
              className="w-full"
              variant="destructive"
            >
              {mergeMutation.isPending ? "Merging..." : "Confirm Merge"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
