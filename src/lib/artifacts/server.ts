import type { UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { codeDocumentHandler } from "@/artifacts/code/server";
import { sheetDocumentHandler } from "@/artifacts/sheet/server";
import { textDocumentHandler } from "@/artifacts/text/server";
import type { ArtifactKind } from "@/components/chat/artifact";
import { saveDocument } from "@/db/queries";
import type { Document } from "@/db/schema";
import type { ChatMessage } from "../types";

// ---------------------------------------------------
// src/lib/artifacts/server.ts
//
// export type SaveDocumentProps                   L44
// id                                              L45
// title                                           L46
// kind                                            L47
// content                                         L48
// userId                                          L49
// export type CreateDocumentCallbackProps         L52
// id                                              L53
// title                                           L54
// dataStream                                      L55
// session                                         L56
// modelId                                         L57
// export type UpdateDocumentCallbackProps         L60
// document                                        L61
// description                                     L62
// dataStream                                      L63
// session                                         L64
// modelId                                         L65
// export type DocumentHandler                     L68
// kind                                            L69
// onCreateDocument                                L70
// onUpdateDocument                                L71
// export function createDocumentHandler()         L74
// kind                                            L75
// onCreateDocument                                L76
// onUpdateDocument                                L77
// export const documentHandlersByArtifactKind    L126
// export const artifactKinds                     L132
// ---------------------------------------------------

export type SaveDocumentProps = {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
};

export type CreateDocumentCallbackProps = {
  id: string;
  title: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  session: Session;
  modelId: string;
};

export type UpdateDocumentCallbackProps = {
  document: Document;
  description: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  session: Session;
  modelId: string;
};

export type DocumentHandler<T = ArtifactKind> = {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
};

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
        session: args.session,
        modelId: args.modelId,
      });

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
      }

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        session: args.session,
        modelId: args.modelId,
      });

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
      }

      return;
    },
  };
}

export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  sheetDocumentHandler,
];

export const artifactKinds = ["text", "code", "sheet"] as const;
