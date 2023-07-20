import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export async function queryPosts(where: Prisma.Sql = Prisma.empty) {
  const result: any = await prisma.$queryRaw`
    SELECT 
      "Post".*,
      "User".id AS "Author.id",
      "User".name AS "Author.name",
      "User".mint AS "Author.mint",
      "User".avatar AS "Author.avatar",
      "Forum".id AS "Forum.id",
      "Forum".config AS "Forum.config",
      (
        SELECT COUNT(*)
        FROM "Comment"
        WHERE "Comment"."post" = "Post"."id"
      ) AS "_count.Comments",
      CAST("createdAt" AS float) + (CAST(likes AS float) * 36000) AS likes_per_created_at
    FROM "Post"
    LEFT JOIN 
      "User" ON "Post"."author" = "User"."id"
    LEFT JOIN 
      "Forum" ON "Post"."forum" = "Forum"."id"
    ${where}
    ORDER BY likes_per_created_at DESC;
  `;

  return result.map((post: any) => {
    const authorId = post["Author.id"];
    const authorName = post["Author.name"];
    const authorMint = post["Author.mint"];
    const authorAvatar = post["Author.avatar"];
    const forumId = post["Forum.id"];
    const forumConfig = post["Forum.config"];
    const commentsCount = post["_count.Comments"];

    delete post["Author.id"];
    delete post["Author.name"];
    delete post["Author.mint"];
    delete post["Author.avatar"];
    delete post["Forum.id"];
    delete post["Forum.config"];
    delete post["_count.Comments"];

    return {
      ...post,
      Author: {
        id: authorId,
        name: authorName,
        mint: authorMint,
        avatar: authorAvatar,
      },
      Forum: {
        id: forumId,
        config: forumConfig,
      },
      _count: {
        Comments: commentsCount,
      },
    };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results = await queryPosts();

  res.json(parseBigInt(results));
}
