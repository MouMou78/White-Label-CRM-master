import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Target, Flame, Plus, X, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Default scoring configuration based on the user's JSON blueprint
const defaultConfig = {
  fit: {
    industries: [
      { name: "SaaS", points: 25 },
      { name: "Technology", points: 25 },
      { name: "B2B Software", points: 25 },
      { name: "Enterprise Software", points: 25 },
    ],
    companySizes: [
      { range: "51-200", points: 20, label: "Ideal (51-200)" },
      { range: "201-500", points: 20, label: "Ideal (201-500)" },
      { range: "501-1000", points: 20, label: "Good (501-1000)" },
      { range: "1001-5000", points: 15, label: "Acceptable (1001-5000)" },
    ],
    seniorities: [
      { level: "C-Level", points: 15 },
      { level: "VP", points: 15 },
      { level: "Director", points: 15 },
      { level: "Manager", points: 10 },
    ],
    regions: [
      { name: "UK&I", points: 10 },
      { name: "Western Europe", points: 10 },
      { name: "North America", points: 10 },
    ],
    tiers: {
      A: { min: 70, label: "Tier A (70+)" },
      B: { min: 40, max: 69, label: "Tier B (40-69)" },
      C: { max: 39, label: "Tier C (0-39)" },
    },
  },
  intent: {
    events: [
      { type: "sales.meeting_booked", points: 20 },
      { type: "sales.demo_attended", points: 15 },
      { type: "website.pricing_view", points: 8 },
      { type: "website.demo_view", points: 6 },
      { type: "marketing.email_click", points: 5 },
      { type: "marketing.content_download", points: 4 },
    ],
    decayHalfLife: 21,
    tiers: {
      Hot: { min: 60, label: "Hot (60+)" },
      Warm: { min: 25, max: 59, label: "Warm (25-59)" },
      Cold: { max: 24, label: "Cold (0-24)" },
    },
  },
  combined: {
    fitWeight: 60,
    intentWeight: 40,
  },
};

export default function ScoringSettings() {
  const [config, setConfig] = useState(defaultConfig);
  const [newIndustry, setNewIndustry] = useState({ name: "", points: 25 });
  const [newRegion, setNewRegion] = useState({ name: "", points: 10 });

  const handleSave = () => {
    // In a real implementation, this would save to the backend
    toast.success("Scoring configuration saved successfully");
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    toast.info("Scoring configuration reset to defaults");
  };

  const addIndustry = () => {
    if (!newIndustry.name.trim()) {
      toast.error("Industry name cannot be empty");
      return;
    }
    setConfig({
      ...config,
      fit: {
        ...config.fit,
        industries: [...config.fit.industries, newIndustry],
      },
    });
    setNewIndustry({ name: "", points: 25 });
    toast.success(`Added ${newIndustry.name} to target industries`);
  };

  const removeIndustry = (index: number) => {
    setConfig({
      ...config,
      fit: {
        ...config.fit,
        industries: config.fit.industries.filter((_, i) => i !== index),
      },
    });
    toast.success("Industry removed");
  };

  const addRegion = () => {
    if (!newRegion.name.trim()) {
      toast.error("Region name cannot be empty");
      return;
    }
    setConfig({
      ...config,
      fit: {
        ...config.fit,
        regions: [...config.fit.regions, newRegion],
      },
    });
    setNewRegion({ name: "", points: 10 });
    toast.success(`Added ${newRegion.name} to priority regions`);
  };

  const removeRegion = (index: number) => {
    setConfig({
      ...config,
      fit: {
        ...config.fit,
        regions: config.fit.regions.filter((_, i) => i !== index),
      },
    });
    toast.success("Region removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Scoring Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure fit and intent scoring rules to prioritize your best leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Fit Scoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Fit Scoring Rules
          </CardTitle>
          <CardDescription>
            Configure criteria that determine how well a lead matches your ideal customer profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Industries */}
          <div>
            <Label className="text-base font-semibold">Target Industries</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Industries that match your ideal customer profile
            </p>
            <div className="space-y-2">
              {config.fit.industries.map((industry, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{industry.name}</span>
                    <Badge variant="secondary">+{industry.points} points</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIndustry(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Industry name"
                  value={newIndustry.name}
                  onChange={(e) => setNewIndustry({ ...newIndustry, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Points"
                  className="w-24"
                  value={newIndustry.points}
                  onChange={(e) => setNewIndustry({ ...newIndustry, points: parseInt(e.target.value) || 0 })}
                />
                <Button onClick={addIndustry}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Company Sizes */}
          <div>
            <Label className="text-base font-semibold">Company Size Preferences</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Employee count ranges that match your target market
            </p>
            <div className="space-y-2">
              {config.fit.companySizes.map((size, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{size.label}</span>
                  <Badge variant="secondary">+{size.points} points</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Seniority Levels */}
          <div>
            <Label className="text-base font-semibold">Decision Maker Seniority</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Job seniority levels that indicate decision-making authority
            </p>
            <div className="space-y-2">
              {config.fit.seniorities.map((seniority, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{seniority.level}</span>
                  <Badge variant="secondary">+{seniority.points} points</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Regions */}
          <div>
            <Label className="text-base font-semibold">Priority Regions</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Geographic regions you actively target
            </p>
            <div className="space-y-2">
              {config.fit.regions.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{region.name}</span>
                    <Badge variant="secondary">+{region.points} points</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRegion(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Region name"
                  value={newRegion.name}
                  onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Points"
                  className="w-24"
                  value={newRegion.points}
                  onChange={(e) => setNewRegion({ ...newRegion, points: parseInt(e.target.value) || 0 })}
                />
                <Button onClick={addRegion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Fit Tier Thresholds */}
          <div>
            <Label className="text-base font-semibold">Fit Tier Thresholds</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Score ranges that determine fit tier classification
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 border rounded-lg">
                <Badge variant="default" className="mb-2">Tier A</Badge>
                <p className="text-sm text-muted-foreground">{config.fit.tiers.A.label}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="secondary" className="mb-2">Tier B</Badge>
                <p className="text-sm text-muted-foreground">{config.fit.tiers.B.label}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="outline" className="mb-2">Tier C</Badge>
                <p className="text-sm text-muted-foreground">{config.fit.tiers.C.label}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intent Scoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Intent Scoring Rules
          </CardTitle>
          <CardDescription>
            Configure event-based signals that indicate buying intent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intent Events */}
          <div>
            <Label className="text-base font-semibold">Intent Signals</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Actions that indicate interest and buying intent
            </p>
            <div className="space-y-2">
              {config.intent.events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{event.type.replace(/_/g, " ").replace(/\./g, " › ")}</span>
                  <Badge variant="secondary">+{event.points} points</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Decay Model */}
          <div>
            <Label className="text-base font-semibold">Score Decay Model</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Intent signals decay over time using exponential half-life
            </p>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-medium">Half-life Period</span>
                <Badge variant="outline">{config.intent.decayHalfLife} days</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Intent scores are reduced by 50% every {config.intent.decayHalfLife} days to prioritize recent activity
              </p>
            </div>
          </div>

          {/* Intent Tier Thresholds */}
          <div>
            <Label className="text-base font-semibold">Intent Tier Thresholds</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Score ranges that determine intent tier classification
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 border rounded-lg">
                <Badge variant="destructive" className="mb-2">Hot</Badge>
                <p className="text-sm text-muted-foreground">{config.intent.tiers.Hot.label}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="default" className="mb-2">Warm</Badge>
                <p className="text-sm text-muted-foreground">{config.intent.tiers.Warm.label}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge variant="secondary" className="mb-2">Cold</Badge>
                <p className="text-sm text-muted-foreground">{config.intent.tiers.Cold.label}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined Score Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Combined Score Weighting</CardTitle>
          <CardDescription>
            How fit and intent scores are combined to calculate the overall lead score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Fit Weight</span>
              <Badge variant="outline">{config.combined.fitWeight}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Intent Weight</span>
              <Badge variant="outline">{config.combined.intentWeight}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Combined Score = (Fit Score × {config.combined.fitWeight}%) + (Intent Score × {config.combined.intentWeight}%)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
