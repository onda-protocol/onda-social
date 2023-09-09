import { menuAnatomy } from "@chakra-ui/anatomy";
import {
  extendTheme,
  createMultiStyleConfigHelpers,
  defineStyle,
} from "@chakra-ui/react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--inter-font" });

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys);

const menuTheme = defineMultiStyleConfig({
  sizes: {
    xl: definePartsStyle({
      list: defineStyle({
        minWidth: "xs",
      }),
      item: defineStyle({
        fontSize: "md",
        fontWeight: "semibold",
        px: "6",
        py: "2",
      }),
    }),
  },
  baseStyle: definePartsStyle({
    list: {
      bg: "#1A1A1B",
      borderRadius: "base",
    },
    item: {
      bgColor: "transparent",
      borderRadius: "sm",
      _hover: {
        bgColor: "whiteAlpha.300",
      },
    },
  }),
});

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  components: {
    Menu: menuTheme,
    Tabs: {
      defaultProps: {
        colorScheme: "gray",
      },
    },
    TabList: {
      baseStyle: {
        borderColor: "gray.800",
      },
    },
    Tab: {
      baseStyle: {
        pb: "1",
      },
    },
    Tag: {
      parts: ["container"],
      baseStyle: {
        container: {
          borderRadius: "sm",
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: "sm",
      },
      variants: {
        ghost: {
          borderRadius: "xl",
          color: "gray.400",
          _hover: {
            bg: "transparent",
            color: "gray.100",
          },
          _active: {
            bg: "transparent",
            color: "gray.50",
          },
        },
        primary: {
          color: "gray.900",
          bg: "gray.50",
          _hover: {
            bg: "gray.100",
            _disabled: {
              bg: "gray.100",
            },
          },
          _active: {
            bg: "gray.100",
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: "gray.100",
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "onda.1050",
        },
        header: {
          color: "gray.100",
        },
      },
    },
    Text: {
      baseStyle: {
        color: "gray.100",
      },
    },
    Table: {
      // parts: ["th", "td"],
      baseStyle: {
        th: {
          color: "gray.200",
        },
        td: {
          color: "gray.200",
          borderBottom: "none",
          py: "1",
          px: "4",
        },
        tbody: {
          tr: {
            "&:nth-of-type(odd)": {
              "th, td": {
                borderBottomWidth: "0px",
              },
            },
            "&:nth-of-type(even)": {
              "th, td": {
                borderBottomWidth: "0px",
              },
            },
            "&:last-of-type": {
              td: {
                borderColor: "gray.900",
              },
            },
          },
        },
        thead: {
          tr: {
            th: {
              py: "4",
              textTransform: "none",
              fontWeight: "medium",
            },
          },
        },
      },
      variants: {
        simple: {
          th: {
            borderBottom: "none",
          },
          td: {
            pb: "4",
          },
        },
      },
      sizes: {
        sm: {
          th: {
            px: "1",
          },
          td: {
            px: "1",
          },
        },
      },
    },
  },
  colors: {
    onda: {
      50: "#CCCDF0",
      100: "#999CE1",
      200: "#4D51CB",
      300: "#383CC0",
      400: "#3034A7",
      500: "#292C8D",
      600: "#222474",
      700: "#1A1C5A",
      800: "#131441",
      900: "#0C0D29",
      950: "#090A20",
    },
  },
  fonts: {
    heading: inter.style.fontFamily,
    body: inter.style.fontFamily,
  },
  styles: {
    global: () => ({
      "html, body": {
        fontSize: "14px",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      },
      html: {
        minHeight: "100%",
        display: "flex",
      },
      body: {
        bg: "onda.950",
        flex: 1,
      },
    }),
  },
});

export default theme;
