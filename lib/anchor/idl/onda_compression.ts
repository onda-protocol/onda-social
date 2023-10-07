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
          name: "flair";
          type: {
            vec: "string";
          };
        },
        {
          name: "gate";
          type: {
            option: {
              vec: {
                defined: "Gate";
              };
            };
          };
        }
      ];
    },
    {
      name: "setAdmin";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "newAdmin";
          isMut: false;
          isSigner: false;
        },
        {
          name: "forumConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "addEntry";
      accounts: [
        {
          name: "author";
          isMut: false;
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
          name: "additionalSigner";
          isMut: false;
          isSigner: false;
          isOptional: true;
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
          isMut: false;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "forumConfig";
          isMut: false;
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
            name: "admin";
            type: "publicKey";
          },
          {
            name: "flair";
            type: {
              vec: "string";
            };
          },
          {
            name: "gate";
            type: {
              vec: {
                defined: "Gate";
              };
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "Gate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "ruleType";
            type: {
              defined: "Rule";
            };
          },
          {
            name: "operator";
            type: {
              defined: "Operator";
            };
          },
          {
            name: "address";
            type: {
              vec: "publicKey";
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
      name: "Rule";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Token";
          },
          {
            name: "Nft";
          },
          {
            name: "CompressedNft";
          },
          {
            name: "AdditionalSigner";
          }
        ];
      };
    },
    {
      name: "Operator";
      type: {
        kind: "enum";
        variants: [
          {
            name: "And";
          },
          {
            name: "Or";
          },
          {
            name: "Not";
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
              },
              {
                name: "flair";
                type: {
                  option: "string";
                };
              },
              {
                name: "nsfw";
                type: "bool";
              },
              {
                name: "spoiler";
                type: "bool";
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
              },
              {
                name: "flair";
                type: {
                  option: "string";
                };
              },
              {
                name: "nsfw";
                type: "bool";
              },
              {
                name: "spoiler";
                type: "bool";
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
              },
              {
                name: "flair";
                type: {
                  option: "string";
                };
              },
              {
                name: "nsfw";
                type: "bool";
              },
              {
                name: "spoiler";
                type: "bool";
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
              },
              {
                name: "flair";
                type: {
                  option: "string";
                };
              },
              {
                name: "nsfw";
                type: "bool";
              },
              {
                name: "spoiler";
                type: "bool";
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
      msg: "Invalid uri";
    },
    {
      code: 6001;
      name: "TitleTooLong";
      msg: "Title too long";
    },
    {
      code: 6002;
      name: "FlairTooLong";
      msg: "Tag too long";
    },
    {
      code: 6003;
      name: "InvalidFlair";
      msg: "Invalid flair";
    },
    {
      code: 6004;
      name: "InsufficientPostCapacity";
      msg: "Insufficient post capacity";
    },
    {
      code: 6005;
      name: "Unauthorized";
      msg: "Unauthorized";
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
          name: "flair",
          type: {
            vec: "string",
          },
        },
        {
          name: "gate",
          type: {
            option: {
              vec: {
                defined: "Gate",
              },
            },
          },
        },
      ],
    },
    {
      name: "setAdmin",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "newAdmin",
          isMut: false,
          isSigner: false,
        },
        {
          name: "forumConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "addEntry",
      accounts: [
        {
          name: "author",
          isMut: false,
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
          name: "additionalSigner",
          isMut: false,
          isSigner: false,
          isOptional: true,
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
          isMut: false,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "forumConfig",
          isMut: false,
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
            name: "admin",
            type: "publicKey",
          },
          {
            name: "flair",
            type: {
              vec: "string",
            },
          },
          {
            name: "gate",
            type: {
              vec: {
                defined: "Gate",
              },
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "Gate",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "ruleType",
            type: {
              defined: "Rule",
            },
          },
          {
            name: "operator",
            type: {
              defined: "Operator",
            },
          },
          {
            name: "address",
            type: {
              vec: "publicKey",
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
      name: "Rule",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Token",
          },
          {
            name: "Nft",
          },
          {
            name: "CompressedNft",
          },
          {
            name: "AdditionalSigner",
          },
        ],
      },
    },
    {
      name: "Operator",
      type: {
        kind: "enum",
        variants: [
          {
            name: "And",
          },
          {
            name: "Or",
          },
          {
            name: "Not",
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
              {
                name: "flair",
                type: {
                  option: "string",
                },
              },
              {
                name: "nsfw",
                type: "bool",
              },
              {
                name: "spoiler",
                type: "bool",
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
              {
                name: "flair",
                type: {
                  option: "string",
                },
              },
              {
                name: "nsfw",
                type: "bool",
              },
              {
                name: "spoiler",
                type: "bool",
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
              {
                name: "flair",
                type: {
                  option: "string",
                },
              },
              {
                name: "nsfw",
                type: "bool",
              },
              {
                name: "spoiler",
                type: "bool",
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
              {
                name: "flair",
                type: {
                  option: "string",
                },
              },
              {
                name: "nsfw",
                type: "bool",
              },
              {
                name: "spoiler",
                type: "bool",
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
      msg: "Invalid uri",
    },
    {
      code: 6001,
      name: "TitleTooLong",
      msg: "Title too long",
    },
    {
      code: 6002,
      name: "FlairTooLong",
      msg: "Tag too long",
    },
    {
      code: 6003,
      name: "InvalidFlair",
      msg: "Invalid flair",
    },
    {
      code: 6004,
      name: "InsufficientPostCapacity",
      msg: "Insufficient post capacity",
    },
    {
      code: 6005,
      name: "Unauthorized",
      msg: "Unauthorized",
    },
  ],
};
