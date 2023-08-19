import { Comment, Forum, Gate, Post, Reward, User } from "@prisma/client";

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
  rewards: AwardsJson;
};
export type PostWithCommentsCountAndForum = DeepReplaceBigInt<
  SerializedPost & {
    Author: User;
    Forum: Forum;
    _count: { Comments: number };
  },
  string
>;

export type SerializedForum = DeepReplaceBigInt<Forum, string> & {
  gates: Gate[];
};
export type SerializedAward = DeepReplaceBigInt<Reward, string>;
export type SerializedComment = DeepReplaceBigInt<Comment, string> & {
  rewards: AwardsJson;
  Author: User;
  _count: { Children: number };
};
export type SerializedCommentNested = SerializedComment & {
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

export function fetchRewards(): Promise<SerializedAward[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/rewards`).then((res) =>
    res.json()
  );
}

export function fetchPost(id: string): Promise<PostWithCommentsCountAndForum> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/post/${id}`).then((res) =>
    res.json()
  );
}

export function fetchPosts(): Promise<PostWithCommentsCountAndForum[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/posts`).then((res) =>
    res.json()
  );
}

export function fetchPostsByForumNamespace(
  namespace: string
): Promise<PostWithCommentsCountAndForum[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/posts/${namespace}`).then(
    (res) => res.json()
  );
}

export function fetchComments(id: string): Promise<SerializedCommentNested[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/post/${id}/comments`).then(
    (res) => res.json()
  );
}

export function fetchUserPosts(
  address: string
): Promise<PostWithCommentsCountAndForum[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/posts`
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

export function fetchAssetsByOwner(address: string, page: number = 1) {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user/${address}/assets?page=${page}`
  ).then((res) => res.json());
}
