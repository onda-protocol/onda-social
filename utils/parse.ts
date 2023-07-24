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
    };
  }

  // if (entryData.linkPost) {
  //   return {
  //     type: "LinkPost",
  //     title: entryData.linkPost.title,
  //     uri: entryData.linkPost.uri,
  //   };
  // }

  if (entryData.imagePost) {
    return {
      type: "ImagePost",
      title: entryData.imagePost.title,
      uri: entryData.imagePost.uri,
      nsfw: entryData.imagePost.nsfw,
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
    default: {
      throw new Error(`Unknown post type: ${postType}`);
    }
  }
}
