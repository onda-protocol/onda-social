export type OndaRewards = {
  version: "0.1.0";
  name: "onda_rewards";
  instructions: [
    {
      name: "createReward";
      accounts: [
        {
          name: "reward";
          isMut: true;
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
          name: "payer";
          isMut: true;
          isSigner: true;
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
          name: "metadataArgs";
          type: {
            defined: "RewardMetadata";
          };
        }
      ];
    },
    {
      name: "giveReward";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: false;
        },
        {
          name: "sessionToken";
          isMut: false;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "reward";
          isMut: true;
          isSigner: false;
        },
        {
          name: "leafOwner";
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
      name: "reward";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            docs: ["The cost in lamports to mint a reward"];
            type: "u64";
          },
          {
            name: "authority";
            docs: ["The tree's authority"];
            type: "publicKey";
          },
          {
            name: "collectionMint";
            docs: ["The reward's collection mint"];
            type: "publicKey";
          },
          {
            name: "metadata";
            docs: ["The reward metadata"];
            type: {
              defined: "RewardMetadata";
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "RewardMetadata";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            docs: ["The name of the asset"];
            type: "string";
          },
          {
            name: "symbol";
            docs: ["The symbol for the asset"];
            type: "string";
          },
          {
            name: "uri";
            docs: ["URI pointing to JSON representing the asset"];
            type: "string";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "Unauthorized";
      msg: "Unauthorized.";
    },
    {
      code: 6001;
      name: "InvalidMint";
      msg: "Invalid mint.";
    },
    {
      code: 6002;
      name: "NumericOverflow";
      msg: "Numeric overflow.";
    }
  ];
};

export const IDL: OndaRewards = {
  version: "0.1.0",
  name: "onda_rewards",
  instructions: [
    {
      name: "createReward",
      accounts: [
        {
          name: "reward",
          isMut: true,
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
          name: "payer",
          isMut: true,
          isSigner: true,
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
          name: "metadataArgs",
          type: {
            defined: "RewardMetadata",
          },
        },
      ],
    },
    {
      name: "giveReward",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: false,
        },
        {
          name: "sessionToken",
          isMut: false,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "reward",
          isMut: true,
          isSigner: false,
        },
        {
          name: "leafOwner",
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
      name: "reward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            docs: ["The cost in lamports to mint a reward"],
            type: "u64",
          },
          {
            name: "authority",
            docs: ["The tree's authority"],
            type: "publicKey",
          },
          {
            name: "collectionMint",
            docs: ["The reward's collection mint"],
            type: "publicKey",
          },
          {
            name: "metadata",
            docs: ["The reward metadata"],
            type: {
              defined: "RewardMetadata",
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "RewardMetadata",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            docs: ["The name of the asset"],
            type: "string",
          },
          {
            name: "symbol",
            docs: ["The symbol for the asset"],
            type: "string",
          },
          {
            name: "uri",
            docs: ["URI pointing to JSON representing the asset"],
            type: "string",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "Unauthorized",
      msg: "Unauthorized.",
    },
    {
      code: 6001,
      name: "InvalidMint",
      msg: "Invalid mint.",
    },
    {
      code: 6002,
      name: "NumericOverflow",
      msg: "Numeric overflow.",
    },
  ],
};
