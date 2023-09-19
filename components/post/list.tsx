import { CSSProperties, memo, useEffect, useMemo, useRef } from "react";
import { InfiniteData } from "@tanstack/react-query";
import { VariableSizeList as List } from "react-window";

import { PostWithCommentsCountAndForum } from "lib/api";
import { PostListItem } from "./listItem";
import { Box, Spinner } from "@chakra-ui/react";
import { FetchMore } from "components/fetchMore";

interface PostListProps {
  data?: InfiniteData<PostWithCommentsCountAndForum[]>;
  displayIcon?: boolean;
  isLoading: boolean;
  shouldFetchMore?: boolean;
  isFetchingMore?: boolean;
  onFetchMore: () => void;
}

type Placeholder = { id: "PLACEHOLDER" };
type Item = PostWithCommentsCountAndForum | Placeholder;
type Items = Item[];

type ItemData = {
  items: Items;
  displayIcon?: boolean;
  isFetchingMore?: boolean;
  onFetchMore: () => void;
  setRowHeight: (index: number, height: number) => void;
};

export const PostList = ({
  data,
  isLoading,
  displayIcon,
  shouldFetchMore,
  isFetchingMore,
  onFetchMore,
}: PostListProps) => {
  const listRef = useRef<List<ItemData>>(null);
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

  const itemData: ItemData = useMemo(
    () => ({
      items,
      displayIcon,
      isFetchingMore,
      onFetchMore,
      setRowHeight,
    }),
    [items, displayIcon, isFetchingMore, onFetchMore]
  );

  const isFetchingRef = useRef(false);
  isFetchingRef.current = Boolean(isFetchingMore);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (!listRef.current) return;

      let next = window.scrollY;

      if (isFetchingRef.current && next > scrollYRef.current) {
        return;
      }

      listRef.current.scrollTo(next);
      scrollYRef.current = next;
    };

    const handleResize = () => {
      if (!listRef.current) return;
      listRef.current.resetAfterIndex(0);
    };

    listRef.current?.scrollTo(window.scrollY);

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleWindowScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
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
      itemData={itemData}
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

interface RowProps {
  index: number;
  data: ItemData;
  style: CSSProperties;
}

const Row = memo(function Row({ index, data, style }: RowProps) {
  const item = data.items[index];
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (el) {
      let styles = window.getComputedStyle(el);
      let marginBottom = parsePixels(styles.marginBottom);
      let border = parsePixels(styles.borderWidth);
      data.setRowHeight(index, el.clientHeight + marginBottom + border);
    }
  }, [index, data, rowRef]);

  if (item.id === "PLACEHOLDER") {
    return (
      <div style={style}>
        <FetchMore
          isFetching={Boolean(data.isFetchingMore)}
          onFetchMore={data.onFetchMore}
        />
      </div>
    );
  }

  return (
    <div style={style}>
      <PostListItem
        ref={rowRef}
        post={item as PostWithCommentsCountAndForum}
        displayIcon={data.displayIcon}
      />
    </div>
  );
});

const cache = new Map<string, number>();

function parsePixels(pixels: string): number {
  if (cache.has(pixels)) {
    return cache.get(pixels)!;
  }
  const ret = Number(pixels.replace("px", ""));
  cache.set(pixels, ret);
  return ret;
}
