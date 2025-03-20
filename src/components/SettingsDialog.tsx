import * as React from "react"
import { Check, Loader2 } from "lucide-react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { defaultProviderSettings, Provider, ProviderSettings, UserSettings, newUserSettings } from "@/types/settings"
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
    <div className="space-y-2">
      <Label htmlFor="anthropic-key">API Key</Label>
      <Input
        id="anthropic-key"
        type="password"
        placeholder="sk-ant-..."
        value={settings.apiKey}
        onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
      />
      <p className="text-[0.8rem] text-muted-foreground">
        Enter your Anthropic API key. You can find this in your Anthropic console.
      </p>
    </div>
  );
}

function OpenAISettings({ settings, onChange }: ProviderSettingsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="openai-key">API Key</Label>
      <Input
        id="openai-key"
        type="password"
        placeholder="sk-..."
        value={settings.apiKey}
        onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
      />
      <p className="text-[0.8rem] text-muted-foreground">
        Enter your OpenAI API key. You can find this in your OpenAI dashboard.
      </p>
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
  const [activeTab, setActiveTab] = React.useState<Provider>("anthropic");

  // Load settings when dialog opens
  React.useEffect(() => {
    if (open) {
      window.settings.get().then(settings => {
        setSettings(settings);
      });
    }
  }, [open]);

  const handleSettingChange = (provider: Provider, providerSettings: ProviderSettings) => {
    setSettings(s => {
      if (!s) {
        return newUserSettings(provider, providerSettings);
      }
      return {
        ...s,
        provider_settings: {
          ...s.provider_settings,
          [provider]: providerSettings
        },
        updated_at: Date.now()
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setError(null);
      setIsSaving(true);

      await window.settings.update(settings);
      await window.chat.reloadSettings();

      toast({
        title: "Settings saved",
        description: "Your API keys have been updated successfully.",
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
          <DialogTitle>Provider Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider API keys. These keys are stored securely and used to make requests to the
            respective providers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as Provider)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            </TabsList>
            <TabsContent value="openai" className="space-y-4 py-4">
              <OpenAISettings
                settings={settings?.provider_settings.openai || defaultProviderSettings}
                onChange={(providerSettings) => handleSettingChange("openai", providerSettings)}
              />
            </TabsContent>
            <TabsContent value="anthropic" className="space-y-4 py-4">
              <AnthropicSettings
                settings={settings?.provider_settings.anthropic || defaultProviderSettings}
                onChange={(providerSettings) => handleSettingChange("anthropic", providerSettings)}
              />
            </TabsContent>
          </Tabs>
          
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
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}