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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { newUserSettings, Provider, UserSettings } from "@/types/settings"

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: string | null;
  onSuccess?: () => void;
}

interface ProviderSettingsProps {
  provider: string;
  settings: UserSettings;
  onChange: (key: string, value: string) => void;
}

function AnthropicSettings({ settings, onChange }: ProviderSettingsProps) {
  const providerSettings = settings?.provider_settings.anthropic
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="anthropic-api-key" className="text-right">
          API Key
        </Label>
        <Input
          id="anthropic-api-key"
          type="password"
          value={providerSettings?.apiKey || ''}
          onChange={(e) => onChange("anthropic.apiKey", e.target.value)}
          placeholder="sk-ant-..."
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="anthropic-chat-model" className="text-right">
          Chat Model
        </Label>
        <Select
          value={providerSettings?.models.chat || 'claude-3-5-sonnet-20241022'}
          onValueChange={(value) => onChange("anthropic.models.chat", value)}
        >
          <SelectTrigger id="anthropic-chat-model" className="col-span-3">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
            <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="anthropic-title-model" className="text-right">
          Title Model
        </Label>
        <Select
          value={providerSettings?.models.title || 'claude-3-5-haiku-20241022'}
          onValueChange={(value) => onChange("anthropic.models.title", value)}
        >
          <SelectTrigger id="anthropic-title-model" className="col-span-3">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
            <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange, error: externalError, onSuccess }: SettingsDialogProps) {
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [draftSettings, setDraftSettings] = React.useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load settings when dialog opens
  React.useEffect(() => {
    if (open) {
      window.settings.get().then(settings => {
        setSettings(settings);
        setDraftSettings(settings); // Initialize draft with current settings
      });
    }
  }, [open]);

  const handleSettingChange = (path: string, value: string) => {
    const [provider, ...rest] = path.split('.');
    const newSettings = draftSettings ? { ...draftSettings } : newUserSettings(provider as Provider);

    // Ensure provider settings exist
    if (!newSettings.provider_settings[provider]) {
      newSettings.provider_settings[provider] = {
        apiKey: "",
        models: { chat: "", title: "" }
      };
    }

    // Update the specific setting
    if (rest.length === 1 && rest[0] === 'apiKey') {
      // Handle apiKey update
      newSettings.provider_settings[provider].apiKey = value;
    } else if (rest.length === 2 && rest[0] === 'models') {
      // Handle models update
      newSettings.provider_settings[provider].models[rest[1]] = value;
    } else {
      console.warn('Unexpected settings path:', path);
      return;
    }

    setDraftSettings(newSettings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftSettings) return;

    try {
      setError(null);
      setIsSaving(true);

      // Validate API key for selected provider
      const provider = draftSettings.model_provider;
      const apiKey = draftSettings.provider_settings[provider]?.apiKey;
      if (!apiKey?.trim()) {
        throw new Error(`Please enter an API key for ${provider}`);
      }

      await window.settings.update({
        model_provider: draftSettings.model_provider,
        provider_settings: draftSettings.provider_settings
      });

      await window.chat.reloadSettings();
      setSettings(draftSettings);
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
      setDraftSettings(settings);
      setError(null);
    }
    onOpenChange(open);
  };

  // if (!settings || !draftSettings) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
              provider="anthropic"
              settings={draftSettings}
              onChange={handleSettingChange}
            />
          </div>
          {(error || externalError) && (
            <div className="mt-4 text-sm text-red-500">
              {error || externalError}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
