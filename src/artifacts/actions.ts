// ---------------------------------------------
// src/artifacts/actions.ts
//
// documentId                                L12
// export async function getSuggestions()    L12
// ---------------------------------------------

"use server";

import { getSuggestionsByDocumentId } from "@/db/queries";

export async function getSuggestions({ documentId }: { documentId: string }) {
  const suggestions = await getSuggestionsByDocumentId({ documentId });
  return suggestions ?? [];
}
