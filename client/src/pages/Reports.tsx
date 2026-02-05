import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState<"deals" | "contacts" | "activities">("deals");

  const { data: contactsData } = trpc.people.list.useQuery();
  
  const exportToCSV = () => {
    let csvContent = "";
    let filename = "";

    if (reportType === "contacts" && (contactsData as any)?.people) {
      filename = `contacts_report_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = "Name,Email,Company,Status\n";
      (contactsData as any).people.forEach((contact: any) => {
        csvContent += `"${contact.name}","${contact.primaryEmail || ''}","${contact.company || ''}","${contact.status || ''}"\n`;
      });
    } else {
      toast.error("No data available to export");
      return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Report exported: ${filename}`);
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Custom Reports</h1>
        <p className="text-muted-foreground">
          Generate and export custom reports with flexible metrics and date ranges
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select metrics and date range for your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deals">Deals Report</SelectItem>
                  <SelectItem value="contacts">Contacts Report</SelectItem>
                  <SelectItem value="activities">Activities Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            <Button onClick={exportToCSV} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>Preview of your report data</CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === "contacts" && (contactsData as any)?.people && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Contacts List</span>
                </div>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Name</th>
                        <th className="p-2 text-left font-medium">Email</th>
                        <th className="p-2 text-left font-medium">Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(contactsData as any).people.slice(0, 10).map((contact: any) => (
                        <tr key={contact.id} className="border-b last:border-0">
                          <td className="p-2">{contact.name}</td>
                          <td className="p-2">{contact.primaryEmail || '-'}</td>
                          <td className="p-2">{contact.company || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(contactsData as any).people.length > 10 && (
                    <div className="p-2 text-xs text-muted-foreground text-center border-t">
                      Showing 10 of {(contactsData as any).people.length} contacts
                    </div>
                  )}
                </div>
              </div>
            )}

            {reportType === "activities" && (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Activities report coming soon
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
