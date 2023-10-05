import type { DAS } from "helius-sdk";
import { IncomingHttpHeaders } from "http";
import {
  Comment,
  Forum,
  Flair,
  Gate,
  Post,
  Award,
  User,
  VoteType,
  CommentVote,
  Notification,
  Claim,
} from "@prisma/client";

import { AuthContext } from "components/providers/auth";
import { SerializedTransactionResponse, TransactionArgs } from "./types";
import { web3 } from "@project-serum/anchor";
import base58 from "bs58";

type DeepReplaceBigInt<T, U> = {
  [K in keyof T]: T[K] extends bigint
    ? U
    : T[K] extends bigint | null
    ? U | null
    : T[K] extends object
    ? DeepReplaceBigInt<T[K], U>
    : T[K];
};

export type AwardsJson = null | {
  [key: string]: {
    count: number;
    name: string;
    image: string;
  };
};
export type SerializedPost = DeepReplaceBigInt<Post, string> & {
  awards: AwardsJson;
};
export type PostWithCommentsCountAndForum = DeepReplaceBigInt<
  SerializedPost & {
    Author: User;
    Flair: Flair | null;
    Forum: Forum;
    _vote: VoteType | null;
    _count: { Comments: number };
  },
  string
>;

export type LinkJson = {
  name: string;
  url: string;
};
export type SerializedForum = DeepReplaceBigInt<Forum, string> & {
  Flair: Flair[];
  Gates: Gate[];
  links: LinkJson[] | null;
};
export type SerializedAward = DeepReplaceBigInt<Award, string> & {
  Matching: SerializedAward;
};
export type SerializedComment = DeepReplaceBigInt<Comment, string> & {
  awards: AwardsJson;
  Author: User;
  Votes: CommentVote[];
  _vote: VoteType | null;
  _count: { Children: number };
};
export type SerializedCommentNested = SerializedComment & {
  _vote: VoteType | null;
  Children?: SerializedCommentNested[];
};

export type NotificationMeta =
  | null
  | {
      claim: string;
      award: string;
      name: string;
      image: string;
      user: string;
      claimed: boolean;
    }
  | {
      name: string;
      image: string;
      commentId: string;
      user: string;
    };

export type SerializedNotification = DeepReplaceBigInt<Notification, string> & {
  meta: NotificationMeta;
  Claim: Claim | null;
};

export function fetchForum(address: string): Promise<SerializedForum> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/forum/${address}`).then(
    (res) => res.json()
  );
}

export function fetchForumByNamespace(
  namespace: string
): Promise<SerializedForum> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/forum/${namespace}/namespace`
  ).then((res) => res.json());
}

export function fetchFora(): Promise<SerializedForum[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/fora`).then((res) =>
    res.json()
  );
}

export function fetchAwards(): Promise<SerializedAward[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/awards`).then((res) =>
    res.json()
  );
}

export function fetchPost(
  id: string,
  incomingHttpHeaders?: IncomingHttpHeaders
): Promise<PostWithCommentsCountAndForum> {
  const headers = new Headers();
  headers.append("Cookie", incomingHttpHeaders?.cookie ?? "");
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/post/${id}`, {
    headers,
  }).then((res) => res.json());
}

export function fetchPosts(
  offset: number = 0
): Promise<PostWithCommentsCountAndForum[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/posts?offset=${offset}`
  ).then((res) => res.json());
}

export function fetchPostsByForumNamespace(
  namespace: string,
  offset: number = 0
): Promise<PostWithCommentsCountAndForum[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/posts/${namespace}?offset=${offset}`
  ).then((res) => res.json());
}

export function fetchComments(
  id: string,
  offset: number = 0,
  limit: number = 20
): Promise<SerializedCommentNested[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/post/${id}/comments?offset=${offset}&limit=${limit}`
  ).then((res) => res.json());
}

export function fetchUserPosts(
  address: string,
  offset: number = 0
): Promise<PostWithCommentsCountAndForum[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/posts?offset=${offset}`
  ).then((res) => res.json());
}

export function fetchUserComments(
  address: string
): Promise<Array<SerializedComment & { Post: SerializedPost }>> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/comments`
  ).then((res) => res.json());
}

export function fetchReplies(
  postId: string,
  commentId: string,
  skip: number = 0
): Promise<SerializedCommentNested[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/post/${postId}/replies/${commentId}?skip=${skip}`
  ).then((res) => res.json());
}

export function fetchUser(id: string): Promise<User> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/user?id=${id}`).then(
    (res) => res.json()
  );
}

export function fetchUserByName(name: string): Promise<User> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/user?name=${name}`).then(
    (res) => res.json()
  );
}

export function fetchNotificationCount(user: string) {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${user}/notifications/unread`
  ).then((res) => res.json());
}

export function markNotificationsAsRead(user: string) {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${user}/notifications/mark`,
    {
      method: "PUT",
    }
  ).then((res) => res.json());
}

export function fetchUserNotifications(
  user: string,
  offset = 0
): Promise<SerializedNotification[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${user}/notifications?offset=${offset}`
  ).then((res) => res.json());
}

export function fetchProof(address: string): Promise<{
  hash: string;
  proof: string[];
}> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/proof/${address}`).then(
    (res) => res.json()
  );
}

interface ForumPassResponse {
  mint: string;
  tokenAccount: string;
  metadata: string | null;
  error?: string;
}

export function fetchForumPass(
  address: string,
  owner: string
): Promise<ForumPassResponse> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/pass/${address}/${owner}`
  ).then((res) => res.json());
}

export function fetchOGTags(
  url: string
): Promise<{ image?: string; height?: string; width?: string }> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/og?url=${url}`).then(
    (res) => res.json()
  );
}

export function fetchAssetsByOwner(
  address: string,
  page: number = 1
): Promise<DAS.GetAssetResponseList["items"]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/assets?page=${page}`
  ).then((res) => res.json());
}

export function fetchAwardsByOwner(
  address: string
): Promise<DAS.GetAssetResponseList["items"]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/awards`
  ).then((res) => res.json());
}

export function updateProfile(
  address: string,
  name: string,
  mint: string | null
): Promise<User> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/update`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      mint,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (res.status !== 200) {
      throw new Error(res.statusText);
    }
    return res.json();
  });
}

export function uploadContent(body: string) {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/upload`, {
    method: "POST",
    body: JSON.stringify({
      data: body,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    const data = await res.json();
    return data.uri;
  });
}

export function getTransaction(
  args: TransactionArgs,
  funded: boolean = false
): Promise<SerializedTransactionResponse> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/transaction`, {
    method: "POST",
    body: JSON.stringify({ ...args, funded }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  });
}

export async function signAndConfirmTransaction(
  connection: web3.Connection,
  auth: AuthContext,
  args: TransactionArgs
) {
  if (!auth.signTransaction) {
    throw new Error("No signTransaction method found");
  }

  if (auth.provider === "magic") {
    const response = await getTransaction(args, true);

    const transaction = web3.Transaction.from(
      base58.decode(response.transaction)
    );
    const payerSig = transaction.signatures.find((sig) =>
      transaction.feePayer?.equals(sig.publicKey)
    );

    if (!payerSig || !payerSig.signature) {
      throw new Error("Payer signature not found");
    }

    const signedTransaction = await auth.signTransaction(transaction);
    signedTransaction.addSignature(payerSig.publicKey, payerSig.signature);
    const txId = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        preflightCommitment: "confirmed",
      }
    );
    const blockhash = await connection.getLatestBlockhash();
    const result = await connection.confirmTransaction(
      {
        signature: txId,
        ...blockhash,
      },
      "confirmed"
    );

    if (result.value.err) {
      throw new Error(result.value.err.toString());
    }

    return {
      txId,
      uri: response.uri,
    };
  } else {
    const response = await getTransaction(args);

    const transaction = web3.Transaction.from(
      base58.decode(response.transaction)
    );

    const signedTransaction = await auth.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        preflightCommitment: "confirmed",
      }
    );
    const blockhash = await connection.getLatestBlockhash();
    const result = await connection.confirmTransaction(
      {
        signature: txId,
        ...blockhash,
      },
      "confirmed"
    );

    if (result.value.err) {
      throw new Error(result.value.err.toString());
    }

    return {
      txId,
      uri: response.uri,
    };
  }
}

export function vote(
  address: string,
  type: "post" | "comment",
  vote: VoteType
): Promise<void> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vote`, {
    method: "POST",
    body: JSON.stringify({
      address,
      type,
      vote,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    if (res.status !== 200) {
      throw new Error(await res.text());
    }
    return res.json();
  });
}
