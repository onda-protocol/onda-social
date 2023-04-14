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
    Forum: Forum;
    _count: { Comments: number };
  },
  string
>;

export type SerializedForum = DeepReplaceBigInt<Forum, string>;
export type SerializedComment = DeepReplaceBigInt<Comment, string> & {
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
