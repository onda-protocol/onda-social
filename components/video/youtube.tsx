import { Box, Fade } from "@chakra-ui/react";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import YouTube from "react-youtube";

interface YouTubeVideoProps {
  uri: string;
}

export const YouTubeVideo = ({ uri }: YouTubeVideoProps) => {
  const elRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();

  const id = useMemo(
    () =>
      uri.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=)?)([a-zA-Z0-9_-]{11})/
      )?.[1],
    [uri]
  );

  useEffect(() => {
    const el = elRef.current;
    if (el?.offsetWidth) {
      setWidth(el.offsetWidth);
      setHeight(el.offsetHeight);
    }
  }, []);

  useLayoutEffect(() => {
    function onResize() {
      const el = elRef.current;
      if (el?.offsetWidth) {
        setWidth(el.offsetWidth);
        setHeight(el.offsetHeight);
      }
    }

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <Box display="flex" justifyContent="center" width="100%">
      <Box width="100%" maxWidth="640px">
        <Box
          ref={elRef}
          position="relative"
          width="100%"
          paddingBottom="56.25%"
          backgroundColor="gray.600"
        >
          <Box position="absolute" inset={0}>
            <Fade in={isReady}>
              {id && height && width && (
                <YouTube
                  loading="lazy"
                  videoId={id}
                  onReady={() => setIsReady(true)}
                  opts={{
                    width,
                    height,
                  }}
                />
              )}
            </Fade>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
