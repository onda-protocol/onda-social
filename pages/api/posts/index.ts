import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client/edge";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export async function queryPosts(
  where: Prisma.Sql = Prisma.empty,
  offset: number = 0
) {
  const result: any = await prisma.$queryRaw`
    SELECT 
      "Post".*,
      "User".id AS "Author.id",
      "User".name AS "Author.name",
      "User".mint AS "Author.mint",
      "User".avatar AS "Author.avatar",
      "Forum".id AS "Forum.id",
      "Forum".config AS "Forum.config",
      "Forum".namespace AS "Forum.namespace",
      "Forum".icon AS "Forum.icon",
      (
        SELECT COUNT(*)
        FROM "Comment"
        WHERE "Comment"."post" = "Post"."id"
      ) AS "_count.Comments",
      CAST("createdAt" AS float) + (CAST(points AS float) * 36000) AS points_per_created_at
    FROM "Post"
    LEFT JOIN 
      "User" ON "Post"."author" = "User"."id"
    LEFT JOIN 
      "Forum" ON "Post"."forum" = "Forum"."id"
    ${where}
    ORDER BY points_per_created_at DESC
    LIMIT 20
    OFFSET ${offset};
  `;

  return result.map((post: any) => {
    const authorId = post["Author.id"];
    const authorName = post["Author.name"];
    const authorMint = post["Author.mint"];
    const authorAvatar = post["Author.avatar"];
    const forumId = post["Forum.id"];
    const forumConfig = post["Forum.config"];
    const forumNamespace = post["Forum.namespace"];
    const forumIcon = post["Forum.icon"];
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
        namespace: forumNamespace,
        icon: forumIcon,
      },
      _count: {
        Comments: commentsCount,
      },
    };
  });
}

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const searchParams = req.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const result = await queryPosts(undefined, offset);
  const parsedResult = parseBigInt(result);
  return NextResponse.json(parsedResult);
}
