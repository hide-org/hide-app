import { APIUserAbortError } from "@anthropic-ai/sdk";

export function isAbortError(error: unknown): error is DOMException {
  return error instanceof APIUserAbortError;
}
