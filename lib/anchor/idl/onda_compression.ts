export type OndaCompression = {
  version: "0.1.0";
  name: "onda_compression";
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
          name: "data";
          type: {
            defined: "DataV1";
          };
        }
      ];
    },
    {
      name: "deleteEntry";
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
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "createdAt";
          type: "i64";
        },
        {
          name: "editedAt";
          type: {
            option: "i64";
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
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
                name: "address";
                type: "publicKey";
              }
            ];
          },
          {
            name: "Mint";
            fields: [
              {
                name: "address";
                type: "publicKey";
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
      name: "DataV1";
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
                name: "uri";
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
                name: "uri";
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
                name: "uri";
                type: "string";
              }
            ];
          },
          {
            name: "VideoPost";
            fields: [
              {
                name: "title";
                type: "string";
              },
              {
                name: "uri";
                type: "string";
              }
            ];
          },
          {
            name: "Comment";
            fields: [
              {
                name: "post";
                type: "publicKey";
              },
              {
                name: "parent";
                type: {
                  option: "publicKey";
                };
              },
              {
                name: "uri";
                type: "string";
              }
            ];
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
      name: "InvalidUri";
      msg: "Invalid uri.";
    },
    {
      code: 6001;
      name: "InsufficientPostCapacity";
      msg: "Insufficient post capacity.";
    },
    {
      code: 6002;
      name: "Unauthorized";
      msg: "Unauthorized.";
    }
  ];
};

export const IDL: OndaCompression = {
  version: "0.1.0",
  name: "onda_compression",
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
          name: "data",
          type: {
            defined: "DataV1",
          },
        },
      ],
    },
    {
      name: "deleteEntry",
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
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "createdAt",
          type: "i64",
        },
        {
          name: "editedAt",
          type: {
            option: "i64",
          },
        },
        {
          name: "dataHash",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "nonce",
          type: "u64",
        },
        {
          name: "index",
          type: "u32",
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
                name: "address",
                type: "publicKey",
              },
            ],
          },
          {
            name: "Mint",
            fields: [
              {
                name: "address",
                type: "publicKey",
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
      name: "DataV1",
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
                name: "uri",
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
                name: "uri",
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
                name: "uri",
                type: "string",
              },
            ],
          },
          {
            name: "VideoPost",
            fields: [
              {
                name: "title",
                type: "string",
              },
              {
                name: "uri",
                type: "string",
              },
            ],
          },
          {
            name: "Comment",
            fields: [
              {
                name: "post",
                type: "publicKey",
              },
              {
                name: "parent",
                type: {
                  option: "publicKey",
                },
              },
              {
                name: "uri",
                type: "string",
              },
            ],
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
      name: "InvalidUri",
      msg: "Invalid uri.",
    },
    {
      code: 6001,
      name: "InsufficientPostCapacity",
      msg: "Insufficient post capacity.",
    },
    {
      code: 6002,
      name: "Unauthorized",
      msg: "Unauthorized.",
    },
  ],
};
