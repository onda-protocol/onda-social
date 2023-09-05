import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VoteType } from "@prisma/client/edge";

import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  try {
    const json = await req.json();
    console.log(json);
    if (!isValidBody(json)) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    if (json.type === "post") {
      const post = prisma.post.findUnique({
        where: {
          id: json.address,
        },
      });

      if (post === null) {
        throw new Response(null, { status: 400, statusText: "Bad Request" });
      }

      await prisma.$transaction(async (transaction) => {
        const data = {
          user: json.user,
          post: json.address,
          vote: json.type === "up" ? VoteType.UP : VoteType.DOWN,
        };

        const vote = await transaction.postVote.findUnique({
          where: {
            user_post: {
              user: json.user,
              post: json.address,
            },
          },
        });

        if (vote !== null && vote.vote === data.vote) {
          throw new StatusError(304, "Not Modified");
        }

        return Promise.all([
          transaction.postVote.upsert({
            where: {
              user_post: {
                user: json.user,
                post: json.address,
              },
            },
            create: data,
            update: data,
          }),
          transaction.post.update({
            where: {
              id: json.address,
            },
            data: {
              points: getOperation(json.type),
            },
          }),
        ]);
      });
    } else {
      const comment = prisma.comment.findUnique({
        where: {
          id: json.address,
        },
      });

      if (comment === null) {
        throw new Response(null, { status: 400, statusText: "Bad Request" });
      }

      await prisma.$transaction(async (transaction) => {
        const data = {
          user: json.user,
          comment: json.address,
          vote: json.type === "up" ? VoteType.UP : VoteType.DOWN,
        };

        const vote = await transaction.commentVote.findUnique({
          where: {
            user_comment: data,
          },
        });

        if (vote !== null && vote.vote === data.vote) {
          throw new StatusError(304, "Not Modified");
        }

        return Promise.all([
          transaction.commentVote.upsert({
            where: {
              user_comment: {
                user: json.user,
                comment: json.address,
              },
            },
            create: data,
            update: data,
          }),
          transaction.comment.update({
            where: {
              id: json.address,
            },
            data: {
              points: getOperation(json.type),
            },
          }),
        ]);
      });
    }
  } catch (err) {
    console.log(err);
    if (err instanceof StatusError) {
      return new Response(null, {
        status: err.status,
        statusText: err.message,
      });
    }
    return new Response(null, { status: 400, statusText: "Bad Request" });
  }

  return NextResponse.json({ result: "ok" });
}

function isValidBody(body: any) {
  if (typeof body !== "object") {
    return false;
  }

  if (typeof body.address !== "string") {
    return false;
  }

  if (body.type !== "comment" && body.type !== "post") {
    return false;
  }

  if (body.vote !== "up" && body.vote !== "down") {
    return false;
  }

  return true;
}

function getOperation(vote: VoteType) {
  switch (vote) {
    case VoteType.UP:
      return {
        increment: 1,
      };

    case VoteType.DOWN:
      return {
        decrement: 1,
      };

    default:
      throw new StatusError(404, "Invalid vote type");
  }
}

class StatusError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
