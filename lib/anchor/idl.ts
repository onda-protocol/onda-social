export type OndaSocial = {
  version: "0.1.0";
  name: "onda_social";
  instructions: [
    {
      name: "initForum";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "forumConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "logWrapper";
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
          name: "restriction";
          type: {
            defined: "RestrictionType";
          };
        }
      ];
    },
    {
      name: "addEntry";
      accounts: [
        {
          name: "author";
          isMut: true;
          isSigner: true;
        },
        {
          name: "forumConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "metadata";
          isMut: false;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "tokenAccount";
          isMut: false;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "logWrapper";
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
          name: "entry";
          type: {
            defined: "EntryArgs";
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "forumConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "totalCapacity";
            type: "u64";
          },
          {
            name: "postCount";
            type: "u64";
          },
          {
            name: "restriction";
            type: {
              defined: "RestrictionType";
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "EntryArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "data";
            type: {
              defined: "EntryData";
            };
          }
        ];
      };
    },
    {
      name: "LeafSchemaEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "eventType";
            type: {
              defined: "OndaSocialEventType";
            };
          },
          {
            name: "version";
            type: {
              defined: "Version";
            };
          },
          {
            name: "schema";
            type: {
              defined: "LeafSchema";
            };
          },
          {
            name: "leafHash";
            type: {
              array: ["u8", 32];
            };
          }
        ];
      };
    },
    {
      name: "RestrictionType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "None";
          },
          {
            name: "Collection";
            fields: [
              {
                name: "collection";
                type: "publicKey";
              }
            ];
          }
        ];
      };
    },
    {
      name: "EntryData";
      type: {
        kind: "enum";
        variants: [
          {
            name: "TextPost";
            fields: [
              {
                name: "title";
                type: "string";
              },
              {
                name: "body";
                type: "string";
              }
            ];
          },
          {
            name: "ImagePost";
            fields: [
              {
                name: "title";
                type: "string";
              },
              {
                name: "src";
                type: "string";
              }
            ];
          },
          {
            name: "LinkPost";
            fields: [
              {
                name: "title";
                type: "string";
              },
              {
                name: "url";
                type: "string";
              }
            ];
          },
          {
            name: "Comment";
            fields: [
              {
                name: "parent";
                type: "publicKey";
              },
              {
                name: "body";
                type: "string";
              }
            ];
          }
        ];
      };
    },
    {
      name: "OndaSocialEventType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Uninitialized";
          },
          {
            name: "LeafSchemaEvent";
          }
        ];
      };
    },
    {
      name: "Version";
      type: {
        kind: "enum";
        variants: [
          {
            name: "V1";
          }
        ];
      };
    },
    {
      name: "EntryType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "TextPost";
          },
          {
            name: "ImagePost";
          },
          {
            name: "LinkPost";
          },
          {
            name: "Comment";
          }
        ];
      };
    },
    {
      name: "LeafSchema";
      type: {
        kind: "enum";
        variants: [
          {
            name: "V1";
            fields: [
              {
                name: "id";
                type: "publicKey";
              },
              {
                name: "entry_type";
                type: {
                  defined: "EntryType";
                };
              },
              {
                name: "author";
                type: "publicKey";
              },
              {
                name: "created_at";
                type: "i64";
              },
              {
                name: "edited_at";
                type: {
                  option: "i64";
                };
              },
              {
                name: "nonce";
                type: "u64";
              },
              {
                name: "data_hash";
                type: {
                  array: ["u8", 32];
                };
              }
            ];
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InsufficientPostCapacity";
      msg: "Insufficient post capacity.";
    },
    {
      code: 6001;
      name: "Unauthorized";
      msg: "Unauthorized.";
    }
  ];
};

export const IDL: OndaSocial = {
  version: "0.1.0",
  name: "onda_social",
  instructions: [
    {
      name: "initForum",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "forumConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "logWrapper",
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
          name: "restriction",
          type: {
            defined: "RestrictionType",
          },
        },
      ],
    },
    {
      name: "addEntry",
      accounts: [
        {
          name: "author",
          isMut: true,
          isSigner: true,
        },
        {
          name: "forumConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "metadata",
          isMut: false,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "tokenAccount",
          isMut: false,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "logWrapper",
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
          name: "entry",
          type: {
            defined: "EntryArgs",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "forumConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "totalCapacity",
            type: "u64",
          },
          {
            name: "postCount",
            type: "u64",
          },
          {
            name: "restriction",
            type: {
              defined: "RestrictionType",
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "EntryArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "data",
            type: {
              defined: "EntryData",
            },
          },
        ],
      },
    },
    {
      name: "LeafSchemaEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "eventType",
            type: {
              defined: "OndaSocialEventType",
            },
          },
          {
            name: "version",
            type: {
              defined: "Version",
            },
          },
          {
            name: "schema",
            type: {
              defined: "LeafSchema",
            },
          },
          {
            name: "leafHash",
            type: {
              array: ["u8", 32],
            },
          },
        ],
      },
    },
    {
      name: "RestrictionType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "None",
          },
          {
            name: "Collection",
            fields: [
              {
                name: "collection",
                type: "publicKey",
              },
            ],
          },
        ],
      },
    },
    {
      name: "EntryData",
      type: {
        kind: "enum",
        variants: [
          {
            name: "TextPost",
            fields: [
              {
                name: "title",
                type: "string",
              },
              {
                name: "body",
                type: "string",
              },
            ],
          },
          {
            name: "ImagePost",
            fields: [
              {
                name: "title",
                type: "string",
              },
              {
                name: "src",
                type: "string",
              },
            ],
          },
          {
            name: "LinkPost",
            fields: [
              {
                name: "title",
                type: "string",
              },
              {
                name: "url",
                type: "string",
              },
            ],
          },
          {
            name: "Comment",
            fields: [
              {
                name: "parent",
                type: "publicKey",
              },
              {
                name: "body",
                type: "string",
              },
            ],
          },
        ],
      },
    },
    {
      name: "OndaSocialEventType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Uninitialized",
          },
          {
            name: "LeafSchemaEvent",
          },
        ],
      },
    },
    {
      name: "Version",
      type: {
        kind: "enum",
        variants: [
          {
            name: "V1",
          },
        ],
      },
    },
    {
      name: "EntryType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "TextPost",
          },
          {
            name: "ImagePost",
          },
          {
            name: "LinkPost",
          },
          {
            name: "Comment",
          },
        ],
      },
    },
    {
      name: "LeafSchema",
      type: {
        kind: "enum",
        variants: [
          {
            name: "V1",
            fields: [
              {
                name: "id",
                type: "publicKey",
              },
              {
                name: "entry_type",
                type: {
                  defined: "EntryType",
                },
              },
              {
                name: "author",
                type: "publicKey",
              },
              {
                name: "created_at",
                type: "i64",
              },
              {
                name: "edited_at",
                type: {
                  option: "i64",
                },
              },
              {
                name: "nonce",
                type: "u64",
              },
              {
                name: "data_hash",
                type: {
                  array: ["u8", 32],
                },
              },
            ],
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InsufficientPostCapacity",
      msg: "Insufficient post capacity.",
    },
    {
      code: 6001,
      name: "Unauthorized",
      msg: "Unauthorized.",
    },
  ],
};
