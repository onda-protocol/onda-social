export type OndaModeration = {
  "version": "0.1.0",
  "name": "onda_moderation",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "forumConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ondaCompression",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "addMember",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newMember",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "role",
          "type": {
            "defined": "Role"
          }
        }
      ]
    },
    {
      "name": "removeMember",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "member",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "deleteEntry",
      "accounts": [
        {
          "name": "member",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "author",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "forumConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "logWrapper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ondaCompression",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "compressionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "createdAt",
          "type": "i64"
        },
        {
          "name": "editedAt",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "dataHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "team",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "forum",
            "type": "publicKey"
          },
          {
            "name": "members",
            "type": {
              "vec": {
                "defined": "Member"
              }
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "role",
            "type": {
              "defined": "Role"
            }
          }
        ]
      }
    },
    {
      "name": "Role",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Owner"
          },
          {
            "name": "Admin"
          },
          {
            "name": "Moderator"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MemberAlreadyExists",
      "msg": "Member already exists."
    },
    {
      "code": 6001,
      "name": "MemberNotFound",
      "msg": "Member not found."
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    }
  ]
};

export const IDL: OndaModeration = {
  "version": "0.1.0",
  "name": "onda_moderation",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "forumConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ondaCompression",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "addMember",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newMember",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "role",
          "type": {
            "defined": "Role"
          }
        }
      ]
    },
    {
      "name": "removeMember",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "member",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "deleteEntry",
      "accounts": [
        {
          "name": "member",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "team",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "author",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "forumConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "merkleTree",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "logWrapper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ondaCompression",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "compressionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "createdAt",
          "type": "i64"
        },
        {
          "name": "editedAt",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "dataHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "team",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "forum",
            "type": "publicKey"
          },
          {
            "name": "members",
            "type": {
              "vec": {
                "defined": "Member"
              }
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "role",
            "type": {
              "defined": "Role"
            }
          }
        ]
      }
    },
    {
      "name": "Role",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Owner"
          },
          {
            "name": "Admin"
          },
          {
            "name": "Moderator"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MemberAlreadyExists",
      "msg": "Member already exists."
    },
    {
      "code": 6001,
      "name": "MemberNotFound",
      "msg": "Member not found."
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    }
  ]
};
