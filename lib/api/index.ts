import { Comment, Post, Forum } from "@prisma/client";

type DeepReplaceBigInt<T, U> = {
  [K in keyof T]: T[K] extends bigint
    ? U
    : T[K] extends object
    ? DeepReplaceBigInt<T[K], U>
    : T[K];
};

export type PostWithCommentsCountAndForum = DeepReplaceBigInt<
  Post & {
    _count: { Comments: number };
  } & {
    Forum: Forum;
  },
  string
>;

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

export function fetchComments(id: string): Promise<Comment[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/post/${id}/comments`).then(
    (res) => res.json()
  );
}
