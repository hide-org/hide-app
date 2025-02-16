import { PostHog } from 'posthog-node'

export class AnalyticsService {
  private posthog: PostHog;
  private enabled: boolean;

  constructor(posthog: PostHog, enabled: boolean = true) {
    this.posthog = posthog;
    this.enabled = enabled;
  }

  public capture(distinctID: string, event: string, properties?: Record<string, any>) {
    if (this.enabled) {
      this.posthog.capture({ distinctId: distinctID, event, properties });
    }
  }
}
