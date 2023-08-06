import { EnrichedTransaction } from "helius-sdk";
import {
  COMPRESSION_PROGRAM_ID,
  BLOOM_PROGRAM_ID,
  PROFILE_PROGRAM_ID,
  MODERATION_PROGRAM_ID,
  NAMESPACE_PROGRAM_ID,
} from "../anchor/constants";
import { compressionParser } from "./compression";
import { bloomParser } from "./bloom";
import { profileParser } from "./profile";
import { namespaceParser } from "./namespace";

export default async function enhancedTransactionParser(
  transactions: EnrichedTransaction[]
) {
  for (const tx of transactions) {
    for (const ix of tx.instructions) {
      switch (ix.programId) {
        case BLOOM_PROGRAM_ID.toBase58(): {
          await bloomParser(ix);
          break;
        }

        case COMPRESSION_PROGRAM_ID.toBase58(): {
          await compressionParser(ix);
          break;
        }

        case MODERATION_PROGRAM_ID.toBase58(): {
          // Do nothing
          break;
        }

        case NAMESPACE_PROGRAM_ID.toBase58(): {
          await namespaceParser(ix);
          // Do nothing
          break;
        }

        case PROFILE_PROGRAM_ID.toBase58(): {
          await profileParser(ix);
          break;
        }

        default: {
          // Do nothing
          break;
        }
      }
    }
  }
}
