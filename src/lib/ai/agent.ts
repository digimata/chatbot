import type { SharedV3ProviderOptions } from "@ai-sdk/provider";
import type { LanguageModel, ToolSet } from "ai";
import { stepCountIs, ToolLoopAgent } from "ai";

// ----------------------------------------
// src/lib/ai/agent.ts
//
// export function createChatAgent()    L16
// model                                L23
// instructions                         L24
// tools                                L25
// activeTools                          L26
// providerOptions                      L27
// ----------------------------------------

export function createChatAgent({
  model,
  instructions,
  tools,
  activeTools,
  providerOptions,
}: {
  model: LanguageModel;
  instructions: string;
  tools: ToolSet;
  activeTools?: string[];
  providerOptions?: SharedV3ProviderOptions;
}) {
  return new ToolLoopAgent({
    model,
    instructions,
    tools,
    stopWhen: stepCountIs(5),
    activeTools,
    providerOptions,
  });
}
