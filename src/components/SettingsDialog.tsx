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
import { UserSettings } from "@/types/settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProviderSettingsProps {
  provider: string;
  settings: UserSettings;
  onChange: (key: string, value: string) => void;
}

function AnthropicSettings({ settings, onChange }: ProviderSettingsProps) {
  const providerSettings = settings.provider_settings.anthropic || {
    apiKey: "",
    models: {
      chat: "claude-3-5-sonnet-20241022",
      title: "claude-3-5-haiku-20241022"
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="anthropic-api-key" className="text-right">
          API Key
        </Label>
        <Input
          id="anthropic-api-key"
          type="password"
          value={providerSettings.apiKey}
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
          value={providerSettings.models.chat}
          onValueChange={(value) => onChange("anthropic.models.chat", value)}
        >
          <SelectTrigger id="anthropic-chat-model" className="col-span-3">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-3-5-sonnet-20241022">Claude 3 Sonnet</SelectItem>
            <SelectItem value="claude-3-5-haiku-20241022">Claude 3 Haiku</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="anthropic-title-model" className="text-right">
          Title Model
        </Label>
        <Select
          value={providerSettings.models.title}
          onValueChange={(value) => onChange("anthropic.models.title", value)}
        >
          <SelectTrigger id="anthropic-title-model" className="col-span-3">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-3-5-sonnet-20241022">Claude 3 Sonnet</SelectItem>
            <SelectItem value="claude-3-5-haiku-20241022">Claude 3 Haiku</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function OpenAISettings({ settings, onChange }: ProviderSettingsProps) {
  const providerSettings = settings.provider_settings.openai || {
    apiKey: "",
    models: {
      chat: "gpt-4-turbo-preview",
      title: "gpt-3.5-turbo"
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="openai-api-key" className="text-right">
          API Key
        </Label>
        <Input
          id="openai-api-key"
          type="password"
          value={providerSettings.apiKey}
          onChange={(e) => onChange("openai.apiKey", e.target.value)}
          placeholder="sk-..."
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="openai-chat-model" className="text-right">
          Chat Model
        </Label>
        <Select
          value={providerSettings.models.chat}
          onValueChange={(value) => onChange("openai.models.chat", value)}
        >
          <SelectTrigger id="openai-chat-model" className="col-span-3">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="openai-title-model" className="text-right">
          Title Model
        </Label>
        <Select
          value={providerSettings.models.title}
          onValueChange={(value) => onChange("openai.models.title", value)}
        >
          <SelectTrigger id="openai-title-model" className="col-span-3">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Load settings when dialog opens
  React.useEffect(() => {
    if (open) {
      window.settings.get().then(setSettings);
    }
  }, [open]);

  const handleProviderChange = (provider: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      model_provider: provider as UserSettings['model_provider']
    });
  };

  const handleSettingChange = (path: string, value: string) => {
    if (!settings) return;

    const [provider, ...rest] = path.split('.');
    const newSettings = { ...settings };

    // Ensure provider settings exist
    if (!newSettings.provider_settings[provider]) {
      newSettings.provider_settings[provider] = {
        apiKey: "",
        models: { chat: "", title: "" }
      };
    }

    // Update the specific setting
    let target = newSettings.provider_settings[provider];
    const lastKey = rest[rest.length - 1];
    for (let i = 0; i < rest.length - 1; i++) {
      target = target[rest[i]];
    }
    target[lastKey] = value;

    setSettings(newSettings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      await window.settings.update({
        model_provider: settings.model_provider,
        provider_settings: settings.provider_settings
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI model providers and preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue={settings.model_provider} onValueChange={handleProviderChange}>
            <div className="flex items-center justify-between">
              <Label>Model Provider</Label>
              <TabsList>
                <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="anthropic">
              <AnthropicSettings
                provider="anthropic"
                settings={settings}
                onChange={handleSettingChange}
              />
            </TabsContent>
            <TabsContent value="openai">
              <OpenAISettings
                provider="openai"
                settings={settings}
                onChange={handleSettingChange}
              />
            </TabsContent>
          </Tabs>
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