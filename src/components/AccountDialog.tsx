import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AccountSettings } from "@/types/account"

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: string | null;
}

export function AccountDialog({ open, onOpenChange, error: externalError }: AccountDialogProps) {
  const [settings, setSettings] = React.useState<AccountSettings | null>(null);
  const [draftSettings, setDraftSettings] = React.useState<Omit<AccountSettings, 'created_at' | 'updated_at'> | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load account settings when dialog opens
  React.useEffect(() => {
    if (open) {
      window.account.get().then(settings => {
        setSettings(settings);
        if (settings) {
          setDraftSettings({
            email: settings.email,
            username: settings.username,
          });
        } else {
          setDraftSettings({
            email: "",
            username: "",
          });
        }
      });
    }
  }, [open]);

  const handleSettingChange = (key: keyof AccountSettings, value: string) => {
    if (!draftSettings) return;
    setDraftSettings({
      ...draftSettings,
      [key]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftSettings) return;

    try {
      setError(null);
      setIsSaving(true);

      // Validate inputs
      if (!draftSettings.email?.trim()) {
        throw new Error("Please enter an email address");
      }
      if (!draftSettings.username?.trim()) {
        throw new Error("Please enter a username");
      }

      const updatedSettings = await window.account.update(draftSettings);
      setSettings(updatedSettings);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving account settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save account settings');
    } finally {
      setIsSaving(false);
    }
  };

  // When dialog closes without saving, reset draft to current settings
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDraftSettings(settings);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account details and preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={draftSettings?.email || ''}
                onChange={(e) => handleSettingChange("email", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={draftSettings?.username || ''}
                onChange={(e) => handleSettingChange("username", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          {(error || externalError) && (
            <div className="mt-4 text-sm text-red-500">
              {error || externalError}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}