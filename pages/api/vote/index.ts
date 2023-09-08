import type { NextFetchEvent, NextRequest } from "next/server";
import { RequestCookies } from "@edge-runtime/cookies";
import { VoteType } from "@prisma/client/edge";
import { NextResponse } from "next/server";

import prisma from "lib/prisma";
import { verifySignature } from "utils/verify";

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

    const cookies = new RequestCookies(req.headers);
    const token = cookies.get("token")?.value;
    const user = cookies.get("currentUser")?.value;

    if (!token || !user) {
      throw new StatusError(401, "Unauthorized");
    }

    const verified = verifySignature(token, user);

    if (verified !== true) {
      throw new StatusError(401, "Unauthorized");
    }

    if (json.type === "post") {
      await prisma.$transaction(async (transaction) => {
        const vote = await transaction.postVote.findUnique({
          where: {
            user_post: {
              user,
              post: json.address,
            },
          },
        });

        const data = {
          user,
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
                    user,
                    post: json.address,
                  },
                },
                create: data,
                update: data,
              },
            },
            points: getOperation(json.vote),
          },
        });
      });
    } else {
      await prisma.$transaction(async (transaction) => {
        const data = {
          user,
          comment: json.address,
          vote: json.type,
        };

        const vote = await transaction.commentVote.findUnique({
          where: {
            user_comment: data,
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
                    user,
                    comment: data.comment,
                  },
                },
                create: data,
                update: data,
              },
            },
            points: getOperation(json.vote),
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
