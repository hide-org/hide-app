import { anthropic } from "@ai-sdk/anthropic"
import { CoreMessage, generateText, tool } from 'ai';
import dotenv from 'dotenv';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

dotenv.config();

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: CoreMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (in Celsius)',
          parameters: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => ({
            location,
            temperature: Math.round((Math.random() * 30 + 5) * 10) / 10, // Random temp between 5°C and 35°C
          }),
        }),
      },
      maxSteps: 5,
      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        if (text) {
          process.stdout.write('Assistant: ' + text + '\n\n');
        }

        toolCalls.map((call, i) => {
          process.stdout.write(`Tool ${i + 1}: ${call.toolName}\n`);
          process.stdout.write(`Input: ${JSON.stringify(call.args)}\n`);
          process.stdout.write(`Output: ${JSON.stringify(toolResults[i].result)}\n`);
        });
      },
    });

    process.stdout.write('\nAssistant: ' + text);
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: text });
  }
}

main().catch(console.error);
