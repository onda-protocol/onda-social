export type OndaAwards = {
  version: "0.1.0";
  name: "onda_awards";
  instructions: [
    {
      name: "createAward";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "award";
          isMut: true;
          isSigner: false;
        },
        {
          name: "matchingAward";
          isMut: false;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "treasury";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMetadata";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionAuthorityRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "maxDepth";
          type: "u32";
        },
        {
          name: "maxBufferSize";
          type: "u32";
        },
        {
          name: "args";
          type: {
            defined: "CreateAwardArgs";
          };
        }
      ];
    },
    {
      name: "giveAward";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "award";
          isMut: false;
          isSigner: false;
        },
        {
          name: "claim";
          isMut: true;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "treasury";
          isMut: true;
          isSigner: false;
        },
        {
          name: "recipient";
          isMut: true;
          isSigner: false;
        },
        {
          name: "entryId";
          isMut: false;
          isSigner: false;
        },
        {
          name: "forumMerkleTree";
          isMut: false;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "collectionAuthorityRecordPda";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMetadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "editionAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumSigner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "leaf";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "index";
          type: "u32";
        }
      ];
    },
    {
      name: "claimAward";
      accounts: [
        {
          name: "recipient";
          isMut: true;
          isSigner: true;
        },
        {
          name: "award";
          isMut: false;
          isSigner: false;
        },
        {
          name: "claim";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treasury";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "collectionAuthorityRecordPda";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMetadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "editionAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumSigner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "award";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            docs: ["The cost in lamports to mint a reward"];
            type: "u64";
          },
          {
            name: "feeBasisPoints";
            docs: ["The amount which goes to the creator"];
            type: "u16";
          },
          {
            name: "authority";
            docs: ["The tree's authority"];
            type: "publicKey";
          },
          {
            name: "treasury";
            docs: ["The award's treasury for fees"];
            type: "publicKey";
          },
          {
            name: "merkleTree";
            docs: ["The merkle tree used for minting cNFTs"];
            type: "publicKey";
          },
          {
            name: "collectionMint";
            docs: ["The award's collection mint"];
            type: "publicKey";
          },
          {
            name: "matching";
            docs: ["Gives claim to the matching award"];
            type: {
              option: {
                defined: "AwardClaims";
              };
            };
          }
        ];
      };
    },
    {
      name: "claim";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u8";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "AwardClaims";
      type: {
        kind: "struct";
        fields: [
          {
            name: "award";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "CreateAwardArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "feeBasisPoints";
            type: "u16";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "Unauthorized";
      msg: "Unauthorized";
    },
    {
      code: 6001;
      name: "NumericOverflow";
      msg: "Numeric overflow";
    },
    {
      code: 6002;
      name: "InvalidUri";
      msg: "Invalid uri";
    },
    {
      code: 6003;
      name: "InvalidArgs";
      msg: "Invalid args";
    },
    {
      code: 6004;
      name: "InvalidTreasury";
      msg: "Invalid treasury";
    },
    {
      code: 6005;
      name: "ClaimNotProvided";
      msg: "Award claim not provided";
    },
    {
      code: 6006;
      name: "InvalidClaim";
      msg: "Invalid claim";
    },
    {
      code: 6007;
      name: "AwardAmountTooLowForClaim";
      msg: "Award amount too low for claim";
    }
  ];
};

export const IDL: OndaAwards = {
  version: "0.1.0",
  name: "onda_awards",
  instructions: [
    {
      name: "createAward",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "award",
          isMut: true,
          isSigner: false,
        },
        {
          name: "matchingAward",
          isMut: false,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "treasury",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMetadata",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionAuthorityRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "maxDepth",
          type: "u32",
        },
        {
          name: "maxBufferSize",
          type: "u32",
        },
        {
          name: "args",
          type: {
            defined: "CreateAwardArgs",
          },
        },
      ],
    },
    {
      name: "giveAward",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "award",
          isMut: false,
          isSigner: false,
        },
        {
          name: "claim",
          isMut: true,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "treasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "entryId",
          isMut: false,
          isSigner: false,
        },
        {
          name: "forumMerkleTree",
          isMut: false,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collectionAuthorityRecordPda",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "editionAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumSigner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "leaf",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "index",
          type: "u32",
        },
      ],
    },
    {
      name: "claimAward",
      accounts: [
        {
          name: "recipient",
          isMut: true,
          isSigner: true,
        },
        {
          name: "award",
          isMut: false,
          isSigner: false,
        },
        {
          name: "claim",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collectionAuthorityRecordPda",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "editionAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumSigner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "award",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            docs: ["The cost in lamports to mint a reward"],
            type: "u64",
          },
          {
            name: "feeBasisPoints",
            docs: ["The amount which goes to the creator"],
            type: "u16",
          },
          {
            name: "authority",
            docs: ["The tree's authority"],
            type: "publicKey",
          },
          {
            name: "treasury",
            docs: ["The award's treasury for fees"],
            type: "publicKey",
          },
          {
            name: "merkleTree",
            docs: ["The merkle tree used for minting cNFTs"],
            type: "publicKey",
          },
          {
            name: "collectionMint",
            docs: ["The award's collection mint"],
            type: "publicKey",
          },
          {
            name: "matching",
            docs: ["Gives claim to the matching award"],
            type: {
              option: {
                defined: "AwardClaims",
              },
            },
          },
        ],
      },
    },
    {
      name: "claim",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u8",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "AwardClaims",
      type: {
        kind: "struct",
        fields: [
          {
            name: "award",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "CreateAwardArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "feeBasisPoints",
            type: "u16",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "Unauthorized",
      msg: "Unauthorized",
    },
    {
      code: 6001,
      name: "NumericOverflow",
      msg: "Numeric overflow",
    },
    {
      code: 6002,
      name: "InvalidUri",
      msg: "Invalid uri",
    },
    {
      code: 6003,
      name: "InvalidArgs",
      msg: "Invalid args",
    },
    {
      code: 6004,
      name: "InvalidTreasury",
      msg: "Invalid treasury",
    },
    {
      code: 6005,
      name: "ClaimNotProvided",
      msg: "Award claim not provided",
    },
    {
      code: 6006,
      name: "InvalidClaim",
      msg: "Invalid claim",
    },
    {
      code: 6007,
      name: "AwardAmountTooLowForClaim",
      msg: "Award amount too low for claim",
    },
  ],
};
