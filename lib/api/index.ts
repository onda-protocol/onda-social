import type { DAS } from "helius-sdk";
import { IncomingHttpHeaders } from "http";
import {
  Comment,
  Forum,
  Gate,
  Post,
  Award,
  User,
  VoteType,
  CommentVote,
} from "@prisma/client";
import { SerializedTransactionResponse, TransactionArgs } from "./types";

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
    image: string;
  };
};
export type SerializedPost = DeepReplaceBigInt<Post, string> & {
  awards: AwardsJson;
};
export type PostWithCommentsCountAndForum = DeepReplaceBigInt<
  SerializedPost & {
    Author: User;
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
  Gates: Gate[];
  links: LinkJson[] | null;
};
export type SerializedAward = DeepReplaceBigInt<Award, string>;
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

export function fetchUser(address: string): Promise<User> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/user/${address}`).then(
    (res) => res.json()
  );
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
  args: TransactionArgs
): Promise<SerializedTransactionResponse> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/transaction`, {
    method: "POST",
    body: JSON.stringify(args),
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
