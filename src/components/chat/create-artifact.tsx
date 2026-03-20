import type { UseChatHelpers } from "@ai-sdk/react";
import type { DataUIPart } from "ai";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import type { Suggestion } from "@/db/schema";
import type { ChatMessage, CustomUIDataTypes } from "@/lib/types";
import type { UIArtifact } from "./artifact";

// ------------------------------------------
// src/components/chat/create-artifact.tsx
//
// export type ArtifactActionContext      L73
// content                                L74
// handleVersionChange                    L75
// currentVersionIndex                    L76
// isCurrentVersion                       L77
// mode                                   L78
// metadata                               L79
// setMetadata                            L80
// type ArtifactAction                    L83
// icon                                   L84
// label                                  L85
// description                            L86
// onClick                                L87
// isDisabled                             L88
// export type ArtifactToolbarContext     L91
// sendMessage                            L92
// export type ArtifactToolbarItem        L95
// description                            L96
// icon                                   L97
// onClick                                L98
// type ArtifactContent                  L101
// title                                 L102
// content                               L103
// mode                                  L104
// isCurrentVersion                      L105
// currentVersionIndex                   L106
// status                                L107
// suggestions                           L108
// onSaveContent                         L109
// isInline                              L110
// getDocumentContentById                L111
// isLoading                             L112
// metadata                              L113
// setMetadata                           L114
// type InitializeParameters             L117
// documentId                            L118
// setMetadata                           L119
// type ArtifactConfig                   L122
// kind                                  L123
// description                           L124
// content                               L125
// actions                               L126
// toolbar                               L127
// initialize                            L128
// onStreamPart                          L129
// setMetadata                           L130
// setArtifact                           L131
// streamPart                            L132
// export class Artifact                 L136
//   readonly kind                       L137
//   readonly description                L138
//   readonly content                    L139
//   readonly actions                    L140
//   readonly toolbar                    L141
//   readonly initialize                 L142
//   readonly onStreamPart               L143
//   setMetadata                         L144
//   setArtifact                         L145
//   streamPart                          L146
//   constructor()                       L149
// ------------------------------------------

export type ArtifactActionContext<M = any> = {
  content: string;
  handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: "edit" | "diff";
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
};

type ArtifactAction<M = any> = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (context: ArtifactActionContext<M>) => Promise<void> | void;
  isDisabled?: (context: ArtifactActionContext<M>) => boolean;
};

export type ArtifactToolbarContext = {
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

export type ArtifactToolbarItem = {
  description: string;
  icon: ReactNode;
  onClick: (context: ArtifactToolbarContext) => void;
};

type ArtifactContent<M = any> = {
  title: string;
  content: string;
  mode: "edit" | "diff";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: "streaming" | "idle";
  suggestions: Suggestion[];
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
};

type InitializeParameters<M = any> = {
  documentId: string;
  setMetadata: Dispatch<SetStateAction<M>>;
};

type ArtifactConfig<T extends string, M = any> = {
  kind: T;
  description: string;
  content: ComponentType<ArtifactContent<M>>;
  actions: ArtifactAction<M>[];
  toolbar: ArtifactToolbarItem[];
  initialize?: (parameters: InitializeParameters<M>) => void;
  onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: DataUIPart<CustomUIDataTypes>;
  }) => void;
};

export class Artifact<T extends string, M = any> {
  readonly kind: T;
  readonly description: string;
  readonly content: ComponentType<ArtifactContent<M>>;
  readonly actions: ArtifactAction<M>[];
  readonly toolbar: ArtifactToolbarItem[];
  readonly initialize?: (parameters: InitializeParameters) => void;
  readonly onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: DataUIPart<CustomUIDataTypes>;
  }) => void;

  constructor(config: ArtifactConfig<T, M>) {
    this.kind = config.kind;
    this.description = config.description;
    this.content = config.content;
    this.actions = config.actions || [];
    this.toolbar = config.toolbar || [];
    this.initialize = config.initialize || (async () => ({}));
    this.onStreamPart = config.onStreamPart;
  }
}
