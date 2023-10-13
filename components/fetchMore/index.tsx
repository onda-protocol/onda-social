import { useEffect, useRef } from "react";
import { Box, Spinner } from "@chakra-ui/react";

interface FetchMoreProps {
  isFetching: boolean;
  onFetchMore: () => void;
}

export const FetchMore = ({ isFetching, onFetchMore }: FetchMoreProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onFetchMore();
      }
    }, options);

    if (!isFetching && ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [onFetchMore, isFetching, ref]);

  return (
    <Box
      ref={ref}
      display="flex"
      alignItems="center"
      justifyContent="center"
      my="12"
    >
      <Spinner />
    </Box>
  );
};
