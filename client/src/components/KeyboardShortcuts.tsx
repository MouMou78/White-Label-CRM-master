import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  modifier?: "ctrl" | "cmd" | "none";
}

export function KeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: "k",
      description: "Open command palette",
      modifier: "ctrl",
      action: () => setShowCommandPalette(true),
    },
    {
      key: "c",
      description: "Create new contact",
      modifier: "none",
      action: () => setLocation("/people"),
    },
    {
      key: "d",
      description: "Create new deal",
      modifier: "none",
      action: () => setLocation("/deals"),
    },
    {
      key: "a",
      description: "Create new account",
      modifier: "none",
      action: () => setLocation("/accounts"),
    },
    {
      key: "?",
      description: "Show keyboard shortcuts",
      modifier: "none",
      action: () => setShowHelp(true),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Esc to close modals even when in input
        if (e.key === "Escape") {
          setShowHelp(false);
          setShowCommandPalette(false);
        }
        return;
      }

      // Check for modifier + key combinations
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K for command palette
      if (modifierKey && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Escape to close dialogs
      if (e.key === "Escape") {
        setShowHelp(false);
        setShowCommandPalette(false);
        return;
      }

      // Single key shortcuts (without modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const shortcut = shortcuts.find(
          (s) => s.key === e.key && s.modifier === "none"
        );
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, setLocation]);

  const getKeyDisplay = (shortcut: Shortcut) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifierDisplay = isMac ? "⌘" : "Ctrl";

    if (shortcut.modifier === "ctrl") {
      return (
        <>
          <Badge variant="outline" className="mr-1">
            {modifierDisplay}
          </Badge>
          <Badge variant="outline">{shortcut.key.toUpperCase()}</Badge>
        </>
      );
    }
    return <Badge variant="outline">{shortcut.key}</Badge>;
  };

  return (
    <>
      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate faster
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Navigation</h3>
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {getKeyDisplay(shortcut)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">General</h3>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent">
                <span className="text-sm">Close dialogs</span>
                <Badge variant="outline">Esc</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent">
                <span className="text-sm">Focus search</span>
                <Badge variant="outline">/</Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette Dialog */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Command Palette</DialogTitle>
            <DialogDescription>
              Quick access to common actions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { label: "Go to Contacts", action: () => setLocation("/people") },
              { label: "Go to Accounts", action: () => setLocation("/accounts") },
              { label: "Go to Deals", action: () => setLocation("/deals") },
              { label: "Go to Analytics", action: () => setLocation("/analytics") },
              { label: "Go to Campaigns", action: () => setLocation("/campaigns") },
              { label: "Go to Tasks", action: () => setLocation("/tasks") },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.action();
                  setShowCommandPalette(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
