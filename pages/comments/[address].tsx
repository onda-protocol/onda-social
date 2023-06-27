import type { NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import { Box, Container, Divider, Heading, Spinner } from "@chakra-ui/react";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react";

import {
  SerializedCommentNested,
  fetchPost,
  fetchComments,
  fetchUser,
} from "lib/api";
import { Editor } from "components/editor";
import { Markdown } from "components/markdown";
import { CommentListItem } from "components/comment";
import { PostMeta } from "components/post/meta";
import { PostButtons } from "components/post/buttons";
import { PostType } from "@prisma/client";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Comments: NextPage<PageProps> = () => {
  const router = useRouter();
  const id = router.query.address as string;
  const postQuery = useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchPost(id),
    enabled: true,
  });
  const commentsQueryKey = ["comments", id];
  const commentsQuery = useQuery({
    queryKey: commentsQueryKey,
    queryFn: () => fetchComments(id),
    enabled: true,
  });
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const onUpdateCache = useCallback(
    async (entryId: string, nonce: string, body: string, uri: string) => {
      if (anchorWallet === undefined) return;

      const userAddress = anchorWallet.publicKey.toBase58();
      const author = await queryClient.fetchQuery(["user", userAddress], () =>
        fetchUser(userAddress)
      );

      queryClient.setQueryData<SerializedCommentNested[]>(
        ["comments", id],
        (data) => {
          const newComment = {
            id: entryId,
            createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
            editedAt: null,
            parent: null,
            post: id,
            body: body,
            uri: uri,
            likes: "0",
            nonce: nonce,
            author: userAddress,
            Author: author,
            Children: [],
            _count: { Children: 0 },
          } as SerializedCommentNested;

          return [newComment, ...(data ?? [])];
        }
      );
    },
    [anchorWallet, id, queryClient]
  );

  if (!postQuery.data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" py="12">
        <Spinner />
      </Box>
    );
  }

  function renderPostBody() {
    switch (postQuery.data?.postType) {
      case PostType.TEXT: {
        return <Markdown>{postQuery.data.body ?? ""}</Markdown>;
      }

      case PostType.IMAGE: {
        return (
          <Box
            position="relative"
            width="100%"
            maxHeight="512px"
            sx={{
              "&:before": {
                content: '""',
                display: "block",
                paddingBottom: "100%",
              },
            }}
          >
            <Image
              fill
              src={postQuery.data.uri}
              alt="post image"
              style={{
                objectFit: "cover",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </Box>
        );
      }
    }
  }

  return (
    <Container maxW="container.md">
      <Box mt="12">
        <PostMeta
          author={postQuery.data.Author}
          forum={postQuery.data.forum}
          createdAt={String(postQuery.data.createdAt)}
        />
        <Heading my="6" as="h1">
          {postQuery.data?.title}
        </Heading>
      </Box>
      <Box mb="6">
        {renderPostBody()}
        <Markdown>{postQuery.data?.body ?? ""}</Markdown>
      </Box>

      <Box mb="6">
        <PostButtons post={postQuery.data} />
      </Box>

      <Editor
        buttonLabel="Comment"
        placeholder="Got some thinky thoughts?"
        config={{
          type: "comment",
          post: id,
          forum: postQuery.data?.forum,
          parent: null,
        }}
        onUpdate={onUpdateCache}
      />

      <Divider my="6" />

      <Box pb="12" mx="-2">
        {commentsQuery.isLoading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            pt="12"
          >
            <Spinner />
          </Box>
        ) : (
          commentsQuery.data?.map((comment) => (
            <CommentListItem
              isRoot
              key={comment.id}
              comment={comment}
              forum={postQuery.data?.forum}
              queryKey={commentsQueryKey}
            />
          )) ?? null
        )}
      </Box>
    </Container>
  );
};

// Comments.getInitialProps = async (ctx) => {
//   if (typeof window === "undefined") {
//     try {
//       const queryClient = new QueryClient();
//       const id = ctx.query.address as string;
//       await queryClient.prefetchQuery(["post", id], () => fetchPost(id));

//       return {
//         dehydratedState: dehydrate(queryClient),
//       };
//     } catch (err) {
//       console.log(err);
//     }
//   }

//   return {
//     dehydratedState: undefined,
//   };
// };

export default Comments;
