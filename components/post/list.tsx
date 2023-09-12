import {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { InfiniteData } from "@tanstack/react-query";
import { VariableSizeList as List } from "react-window";

import { PostWithCommentsCountAndForum } from "lib/api";
import { PostListItem } from "./listItem";
import { Box, Spinner } from "@chakra-ui/react";
import { FetchMore } from "components/fetchMore";

interface PostListProps {
  data?: InfiniteData<PostWithCommentsCountAndForum[]>;
  isLoading: boolean;
  shouldFetchMore?: boolean;
  isFetchingMore?: boolean;
  onFetchMore: () => void;
}

interface RowProps {
  index: number;
  style: CSSProperties;
}

type Placeholder = { id: "PLACEHOLDER" };
type Item = PostWithCommentsCountAndForum | Placeholder;
type Items = Item[];

export const PostList = ({
  data,
  isLoading,
  shouldFetchMore,
  isFetchingMore,
  onFetchMore,
}: PostListProps) => {
  const listRef = useRef<List<HTMLDivElement>>(null);
  const scrollYRef = useRef<number>(0);
  const outerRef = useRef<HTMLDivElement>(null);
  const rowHeights = useRef<number[]>([]);
  const items: Items = useMemo(() => {
    const posts: Items = data?.pages.flat() ?? [];

    if (shouldFetchMore) {
      posts.push({ id: "PLACEHOLDER" });
    }

    return posts;
  }, [data, shouldFetchMore]);

  function getRowHeight(index: number) {
    return rowHeights.current[index] ?? 180;
  }

  function setRowHeight(index: number, height: number) {
    rowHeights.current = { ...rowHeights.current, [index]: height };
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }

  const Row = ({ index, style }: RowProps) => {
    const item = items[index];
    const rowRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      const el = rowRef.current;
      if (el) {
        let styles = window.getComputedStyle(el);
        let marginBottom = parsePixels(styles.marginBottom);
        let border = parsePixels(styles.borderWidth);
        setRowHeight(index, el.clientHeight + marginBottom + border);
      }
    }, [index, rowRef]);

    if (item.id === "PLACEHOLDER") {
      return (
        <div style={style}>
          <FetchMore
            isFetching={Boolean(isFetchingMore)}
            onFetchMore={onFetchMore}
          />
        </div>
      );
    }

    return (
      <div style={style}>
        <PostListItem
          ref={rowRef}
          post={item as PostWithCommentsCountAndForum}
        />
      </div>
    );
  };

  const isFetchingRef = useRef(false);
  isFetchingRef.current = Boolean(isFetchingMore);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (!listRef.current) return;
      if (!outerRef.current) return;

      let next = window.scrollY;

      if (isFetchingRef.current && next > scrollYRef.current) {
        return;
      }

      listRef.current.scrollTo(next);
      scrollYRef.current = next;
    };

    listRef.current?.scrollTo(window.scrollY);
    window.addEventListener("scroll", handleWindowScroll);
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, []);

  if (isLoading) {
    return (
      <Box flex={1} display="flex" justifyContent="center" my="12">
        <Spinner />
      </Box>
    );
  }

  function itemKey(index: number) {
    const item = items[index];
    return item.id;
  }

  return (
    <List
      ref={listRef}
      outerRef={outerRef}
      height={window.innerHeight}
      width="100%"
      itemCount={items.length}
      itemSize={getRowHeight}
      itemKey={itemKey}
      style={{
        overflow: "hidden",
        height: "100%",
        marginTop: "var(--chakra-space-4)",
      }}
    >
      {Row}
    </List>
  );
};

const cache = new Map<string, number>();

function parsePixels(pixels: string): number {
  if (cache.has(pixels)) {
    return cache.get(pixels)!;
  }
  const ret = Number(pixels.replace("px", ""));
  cache.set(pixels, ret);
  return ret;
}
