export type CommentArgs = {
  type: "comment";
  author: string;
  post: string;
  parent: string | null;
  body: string;
  forum: string;
};

export type TextPostArgs = {
  type: "textPost";
  author: string;
  title: string;
  body: string;
  flair: string | null;
  forum: string;
};

export type LinkPostArgs = {
  type: "linkPost";
  author: string;
  title: string;
  url: string;
  flair: string | null;
  forum: string;
};

export type EntryDataArgs = CommentArgs | TextPostArgs | LinkPostArgs;

export type AddEntryTransaction = {
  method: "addEntry";
  data: EntryDataArgs;
};

export type DeleteEntryTransaction = {
  method: "deleteEntry";
  data: {
    author: string;
    forum: string;
    entryId: string;
    entryType: "comment" | "post";
  };
};

export type GiveAwardArgs = {
  method: "giveAward";
  data: {
    entryId: string;
    author: string;
    payer: string;
    award: string;
    forum: string;
    createdAt: number;
    editedAt: number | null;
    dataHash: string;
    nonce: number;
  };
};

export type ClaimAwardArgs = {
  method: "claimAward";
  data: {
    award: string;
    claim: string;
    recipient: string;
  };
};

export type TransactionArgs =
  | AddEntryTransaction
  | DeleteEntryTransaction
  | GiveAwardArgs
  | ClaimAwardArgs;

export type SerializedTransactionResponse = {
  transaction: string;
  uri?: string;
};
export type TransactionResponse =
  | SerializedTransactionResponse
  | { error: string };
