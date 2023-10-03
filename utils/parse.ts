import { PostType } from "@prisma/client";
import { camelCase } from "lodash";
import { DataV1 } from "../lib/anchor/types";

export function parseDataV1Fields(entryData: DataV1) {
  if (entryData.textPost) {
    return {
      type: "TextPost",
      title: entryData.textPost.title,
      uri: entryData.textPost.uri,
      nsfw: entryData.textPost.nsfw,
      spoiler: entryData.textPost.spoiler,
      flair: entryData.textPost.flair,
    };
  }

  if (entryData.linkPost) {
    return {
      type: "LinkPost",
      title: entryData.linkPost.title,
      uri: entryData.linkPost.uri,
      spoiler: entryData.linkPost.spoiler,
      flair: entryData.linkPost.flair,
    };
  }

  if (entryData.imagePost) {
    return {
      type: "ImagePost",
      title: entryData.imagePost.title,
      uri: entryData.imagePost.uri,
      nsfw: entryData.imagePost.nsfw,
      spoiler: entryData.imagePost.spoiler,
      flair: entryData.imagePost.flair,
    };
  }

  if (entryData.comment) {
    return {
      type: "Comment",
      post: entryData.comment.post,
      parent: entryData.comment.parent,
      uri: entryData.comment.uri,
    };
  }

  throw new Error("Invalid entry data");
}

export function getPrismaPostType(postType: string): PostType {
  switch (camelCase(postType)) {
    case "textPost":
      return PostType.TEXT;
    case "imagePost":
      return PostType.IMAGE;
    case "linkPost":
      return PostType.LINK;
    default: {
      throw new Error(`Unknown post type: ${postType}`);
    }
  }
}
