type Method = "addEntry";

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
  forum: string;
};

export type LinkPostArgs = {
  type: "linkPost";
  author: string;
  title: string;
  url: string;
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
    payer: string;
    award: string;
    entryId: string;
  };
};

export type TransactionArgs =
  | AddEntryTransaction
  | DeleteEntryTransaction
  | GiveAwardArgs;

export type SerializedTransactionResponse = {
  transaction: string;
  uri?: string;
};
export type TransactionResponse =
  | SerializedTransactionResponse
  | { error: string };
