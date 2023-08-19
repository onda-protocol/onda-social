export type OndaNamespace = {
  version: "0.1.0";
  name: "onda_namespace";
  instructions: [
    {
      name: "createNamespace";
      accounts: [
        {
          name: "admin";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treeMarker";
          isMut: true;
          isSigner: false;
        },
        {
          name: "forumConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "merkleTree";
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
          name: "name";
          type: "string";
        },
        {
          name: "uri";
          type: "string";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "namespace";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          },
          {
            name: "uri";
            type: "string";
          },
          {
            name: "merkleTree";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "treeMarker";
      type: {
        kind: "struct";
        fields: [
          {
            name: "namespace";
            type: "publicKey";
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
    }
  ];
};

export const IDL: OndaNamespace = {
  version: "0.1.0",
  name: "onda_namespace",
  instructions: [
    {
      name: "createNamespace",
      accounts: [
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treeMarker",
          isMut: true,
          isSigner: false,
        },
        {
          name: "forumConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "merkleTree",
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
          name: "name",
          type: "string",
        },
        {
          name: "uri",
          type: "string",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "namespace",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string",
          },
          {
            name: "uri",
            type: "string",
          },
          {
            name: "merkleTree",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "treeMarker",
      type: {
        kind: "struct",
        fields: [
          {
            name: "namespace",
            type: "publicKey",
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
  ],
};
