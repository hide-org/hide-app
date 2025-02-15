import posthog from 'posthog-js'
import { v4 as uuidv4 } from 'uuid'

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS_TEST === 'true';
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;

export const initAnalytics = () => {
  if (IS_PRODUCTION || ENABLE_ANALYTICS) {
    posthog.init(POSTHOG_API_KEY, {
      api_host: 'https://eu.i.posthog.com',
      persistence: 'localStorage',
      autocapture: false,
      capture_pageview: false,
      mask_all_text: true,
      mask_all_element_attributes: true,
      disable_session_recording: true,
      opt_out_capturing_by_default: false,
      debug: true,
      person_profiles: 'identified_only',
      on_request_error: (error) => {
        console.debug('PostHog request error:', error);
      },
      bootstrap: {
        distinctID: uuidv4(), // Generate a unique ID for each installation
      }
    })

    posthog.debug();

    console.debug('PostHog analytics initialized', {
      env: IS_PRODUCTION ? 'production' : 'development',
      testing: ENABLE_ANALYTICS,
      apiKey: POSTHOG_API_KEY?.slice(0, 8) + '...'
    });

    posthog.capture('test_event', {
      source: 'initialization'
    });
  } else {
    console.debug('PostHog analytics not initialized - not in production or test mode');
  }
}

export const captureEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (IS_PRODUCTION || ENABLE_ANALYTICS) {
    console.debug('Capturing event:', eventName, properties);
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
  }
} 