import type { NextFetchEvent, NextRequest } from "next/server";
import { VoteType } from "@prisma/client/edge";
import { NextResponse } from "next/server";

import prisma from "lib/prisma";
import { getCurrentUser } from "utils/verify";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  try {
    const json = await req.json();

    if (!isValidBody(json)) {
      throw new StatusError(400, "Bad Request");
    }

    const currentUser = await getCurrentUser(req);

    if (currentUser === null) {
      throw new StatusError(401, "Unauthorized");
    }

    if (json.type === "post") {
      await prisma.$transaction(async (transaction) => {
        const vote = await transaction.postVote.findUnique({
          where: {
            user_post: {
              user: currentUser,
              post: json.address,
            },
          },
        });

        const data = {
          user: currentUser,
          vote: json.vote,
        };

        if (vote !== null && vote.vote === data.vote) {
          throw new StatusError(304, "Not Modified");
        }

        await transaction.post.update({
          where: {
            id: json.address,
          },
          data: {
            Votes: {
              upsert: {
                where: {
                  user_post: {
                    user: currentUser,
                    post: json.address,
                  },
                },
                create: data,
                update: data,
              },
            },
            points: getOperation(json.vote, vote !== null),
          },
        });
      });
    } else {
      await prisma.$transaction(async (transaction) => {
        const data = {
          user: currentUser,
          vote: json.vote,
        };

        const vote = await transaction.commentVote.findUnique({
          where: {
            user_comment: {
              user: currentUser,
              comment: json.address,
            },
          },
        });

        if (vote !== null && vote.vote === data.vote) {
          throw new StatusError(304, "Not Modified");
        }

        await transaction.comment.update({
          where: {
            id: json.address,
          },
          data: {
            Votes: {
              upsert: {
                where: {
                  user_comment: {
                    user: currentUser,
                    comment: json.address,
                  },
                },
                create: data,
                update: data,
              },
            },
            points: getOperation(json.vote, vote !== null),
          },
        });
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

  if (body.vote !== VoteType.UP && body.vote !== VoteType.DOWN) {
    return false;
  }

  return true;
}

function getOperation(vote: VoteType, undo: boolean) {
  switch (vote) {
    case VoteType.UP:
      return {
        increment: undo ? 2 : 1,
      };

    case VoteType.DOWN:
      return {
        decrement: undo ? 2 : 1,
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
