import { Comment, Post, Forum, User } from "@prisma/client";

type DeepReplaceBigInt<T, U> = {
  [K in keyof T]: T[K] extends bigint
    ? U
    : T[K] extends object
    ? DeepReplaceBigInt<T[K], U>
    : T[K];
};

export type SerializedPost = DeepReplaceBigInt<Post, string>;
export type PostWithCommentsCountAndForum = DeepReplaceBigInt<
  Post & {
    Author: User;
    Forum: Forum;
    _count: { Comments: number };
  },
  string
>;

export type SerializedForum = DeepReplaceBigInt<Forum, string>;
export type SerializedComment = DeepReplaceBigInt<Comment, string> & {
  Author: User;
  _count: { Children: number };
};
export type SerializedCommentNested = SerializedComment & {
  Children?: SerializedComment[];
};

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
  commentId: string
): Promise<SerializedCommentNested[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/post/${postId}/replies/${commentId}`
  ).then((res) => res.json());
}

export function fetchFora(): Promise<SerializedForum[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/fora`).then((res) =>
    res.json()
  );
}

export function fetchUser(address: string): Promise<User> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/user/${address}`).then(
    (res) => res.json()
  );
}
