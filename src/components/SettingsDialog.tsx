import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { defaultProviderSettings, getCurrentProviderApiKey, newUserSettings, Provider, ProviderSettings, UserSettings } from "@/types/settings"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  className?: string;
}

interface ProviderSettingsProps {
  settings: ProviderSettings;
  onChange: (settings: ProviderSettings) => void;
}

function AnthropicSettings({ settings, onChange }: ProviderSettingsProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="anthropic-api-key" className="text-right">
          API Key
        </Label>
        <Input
          id="anthropic-api-key"
          type="password"
          value={settings.apiKey}
          onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
          placeholder="sk-ant-..."
          className="col-span-3"
        />
      </div>
    </div>
  );
}

export function SettingsDialog({
  open,
  onOpenChange,
  onSuccess,
  className
}: SettingsDialogProps) {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load settings when dialog opens
  React.useEffect(() => {
    if (open) {
      window.settings.get().then(settings => {
        setSettings(settings);
      });
    }
  }, [open]);

  const handleSettingChange = (provider: Provider, settings: ProviderSettings) => {
    setSettings(s => {
      if (!s) {
        return newUserSettings(provider, settings);
      }
      return {
        ...s,
        provider_settings: {
          ...s.provider_settings,
          [provider]: settings
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setError(null);
      setIsSaving(true);

      // Validate API key for selected provider
      const apiKey = getCurrentProviderApiKey(settings);
      if (!apiKey?.trim()) {
        throw new Error(`Please enter an API key for ${settings.model_provider}`);
      }

      await window.settings.update(settings);
      await window.chat.reloadSettings();

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
        duration: 3000,
        variant: "success"
      })

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // When dialog closes without saving, reset draft to current settings
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
      <DialogContent className={cn("sm:max-w-[600px]", className)}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI model provider and preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Model Provider</Label>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-accent text-accent-foreground">
                Anthropic
              </span>
            </div>
            <AnthropicSettings
              settings={settings ? settings.provider_settings.anthropic : defaultProviderSettings}
              onChange={(settings) => handleSettingChange("anthropic", settings)}
            />
          </div>
          {(error) && (
            <div className="mt-4 text-sm text-red-500">
              {error}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
