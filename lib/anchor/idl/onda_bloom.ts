export type OndaBloom = {
  version: "0.1.0";
  name: "onda_bloom";
  instructions: [
    {
      name: "feedPlankton";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "depositTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "author";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authorTokenAccount";
          isMut: true;
          isSigner: true;
        },
        {
          name: "bloom";
          isMut: true;
          isSigner: false;
        },
        {
          name: "protocolFeeTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "entryId";
          type: "publicKey";
        },
        {
          name: "amount";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "bloom";
      type: {
        kind: "struct";
        fields: [
          {
            name: "plankton";
            type: "u64";
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

export const IDL: OndaBloom = {
  version: "0.1.0",
  name: "onda_bloom",
  instructions: [
    {
      name: "feedPlankton",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "depositTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "author",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authorTokenAccount",
          isMut: true,
          isSigner: true,
        },
        {
          name: "bloom",
          isMut: true,
          isSigner: false,
        },
        {
          name: "protocolFeeTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "entryId",
          type: "publicKey",
        },
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "bloom",
      type: {
        kind: "struct",
        fields: [
          {
            name: "plankton",
            type: "u64",
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
