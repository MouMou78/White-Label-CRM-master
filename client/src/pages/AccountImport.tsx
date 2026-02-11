import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccountImport() {
  const [, setLocation] = useLocation();
  const [csvContent, setCsvContent] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const parseCSVMutation = trpc.accounts.parseCSV.useMutation({
    onSuccess: (data) => {
      setHeaders(data.headers);
      setPreview(data.preview);
      setTotalRows(data.totalRows);
      // Auto-map common fields
      const autoMapping: Record<string, string> = {};
      data.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('name') || lowerHeader === 'account') autoMapping.name = header;
        if (lowerHeader.includes('domain') || lowerHeader.includes('website')) autoMapping.domain = header;
        if (lowerHeader.includes('industry')) autoMapping.industry = header;
        if (lowerHeader.includes('headquarters') || lowerHeader.includes('location')) autoMapping.headquarters = header;
      });
      setFieldMapping(autoMapping);
      toast.success("CSV parsed successfully!");
    },
    onError: (error) => {
      toast.error(`Parse failed: ${error.message}`);
    },
  });

  const importMutation = trpc.accounts.importAccounts.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      toast.success(`Imported ${data.imported} accounts, skipped ${data.skipped}`);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseCSVMutation.mutate({ csvContent: content });
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!fieldMapping.name) {
      toast.error("Please map the 'Name' field");
      return;
    }

    importMutation.mutate({
      csvContent,
      fieldMapping,
    });
  };

  const handleReset = () => {
    setCsvContent("");
    setHeaders([]);
    setPreview([]);
    setTotalRows(0);
    setFieldMapping({});
    setImportResult(null);
  };

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
          <Upload className="h-8 w-8" />
          Import Accounts
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file to import multiple accounts at once. Duplicates will be skipped.
        </p>
      </div>

      {/* File Upload */}
      {!csvContent && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Your CSV should have columns for Name, Domain, Industry, and Headquarters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button asChild>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Mapping */}
      {headers.length > 0 && !importResult && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Map Fields</CardTitle>
              <CardDescription>
                Match your CSV columns to account fields. Found {totalRows} rows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['name', 'domain', 'industry', 'headquarters'].map((field) => (
                <div key={field} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="capitalize font-medium">
                    {field} {field === 'name' && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={fieldMapping[field] || ""}
                    onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>First 5 rows from your CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {headers.map((header) => (
                        <th key={header} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        {headers.map((header) => (
                          <td key={header} className="p-2">
                            {row[header] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || !fieldMapping.name}
              className="flex-1"
            >
              {importMutation.isPending ? "Importing..." : `Import ${totalRows} Accounts`}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">{importResult.imported} Imported</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">{importResult.skipped} Skipped</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <p className="font-medium text-destructive mb-2">Errors:</p>
                <ul className="text-sm space-y-1">
                  {importResult.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx} className="text-muted-foreground">• {error}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li className="text-muted-foreground">... and {importResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={() => setLocation("/accounts")} className="flex-1">
                View Accounts
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props}>{children}</label>;
}
