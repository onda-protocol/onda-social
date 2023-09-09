import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import { getCurrentUser } from "utils/verify";
import prisma from "lib/prisma";
import { SerializedComment, SerializedCommentNested } from "lib/api";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const parent = searchParams.get("parent");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const currentUser = await getCurrentUser(req);
  const votes = currentUser
    ? {
        where: {
          user: currentUser,
        },
        select: {
          vote: true,
        },
      }
    : false;

  const result = await prisma.comment.findMany({
    where: {
      parent,
      post: address as string,
    },
    orderBy: {
      points: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      Author: true,
      Votes: votes,
      Children: {
        take: 3,
        orderBy: {
          points: "desc",
        },
        include: {
          Author: true,
          Votes: votes,
          Children: {
            take: 3,
            orderBy: {
              points: "desc",
            },
            include: {
              Author: true,
              Votes: votes,
              Children: {
                take: 3,
                orderBy: {
                  points: "desc",
                },
                include: {
                  Author: true,
                  Votes: votes,
                  _count: {
                    select: {
                      Children: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  Children: true,
                },
              },
            },
          },
          _count: {
            select: {
              Children: true,
            },
          },
        },
      },
      _count: {
        select: {
          Children: true,
        },
      },
    },
  });

  const parsedResults = parseBigInt(result);
  const comments = parsedResults.map(mapNestedComment);

  return NextResponse.json(comments);
}

export function mapNestedComment(comment: SerializedCommentNested) {
  comment._vote = comment.Votes?.[0]?.vote ?? null;
  comment.Children = comment.Children?.map(mapNestedComment) ?? [];
  return comment;
}
