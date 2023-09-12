import { menuAnatomy } from "@chakra-ui/anatomy";
import {
  extendTheme,
  createMultiStyleConfigHelpers,
  defineStyle,
} from "@chakra-ui/react";
import { IBM_Plex_Sans, Noto_Sans } from "next/font/google";

const heading = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      bg: "onda.1000",
      borderRadius: "base",
    },
    item: {
      bgColor: "transparent",
      borderRadius: "sm",
      _hover: {
        bgColor: "deftBlue",
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
    Heading: {
      baseStyle: {
        color: "whiteAlpha.900",
      },
    },
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
          bg: "whiteAlpha.800",
          _hover: {
            bg: "whiteAlpha.900",
            _disabled: {
              bg: "whiteAlpha.600",
            },
          },
          _active: {
            bg: "gray.100",
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "onda.1050",
        },
        header: {
          color: "whiteAlpha.800",
        },
      },
    },
    Text: {
      baseStyle: {
        color: "whiteAlpha.800",
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
      50: "#4055B5",
      100: "#3A4EA6",
      200: "#354797",
      300: "#304088",
      400: "#2A3979",
      500: "#25326A",
      600: "#202B5A",
      700: "#1B244B",
      800: "#151D3C",
      900: "#10162D",
      1000: "#080B16",
      1050: "#0F121C",
    },
    oxfordBlue: "#11182F",
    deftBlue: "#34396A",
    prussianBlue: "#1E293B",
    steelBlue: "#3182CE",
    xanthous: "#EAB308",
    folly: "#FF004D",
    cardinal: "#CC003D",
    pumpkin: "#FF7A00",
    bodyText: "#E2E8F0",
  },
  fonts: {
    heading: heading.style.fontFamily,
    body: body.style.fontFamily,
  },
  styles: {
    global: () => ({
      "html, body": {
        fontSize: "14px",
        lineHeight: "tall",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      },
      html: {
        minHeight: "100%",
        display: "flex",
      },
      body: {
        bg: "onda.1000",
        flex: 1,
      },
    }),
  },
});

export default theme;
