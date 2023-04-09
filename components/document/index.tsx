import { Box, Container, Text } from "@chakra-ui/react";
import Head from "next/head";
import Image from "next/image";
import { Fragment } from "react";

interface DocumentHead {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  url: string;
  twitterLabels?: { label: string; value: string }[];
}

export const DocumentHead = ({
  title,
  description,
  image,
  imageAlt,
  url,
  twitterLabels = [],
}: DocumentHead) => {
  return (
    <Head>
      <title key="title">{title}</title>
      <meta key="description" name="description" content={description} />
      <meta key="author" name="author" content="Dexloan" />
      <link
        key="shortcut-icon"
        rel="shortcut icon"
        type="image/x-icon"
        href="/favicon.ico"
      ></link>
      <link
        key="icon"
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/android-chrome-192.png"
      />

      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:type" property="og:type" content="website" />
      <meta
        key="og:description"
        property="og:description"
        content={description}
      />
      <meta
        key="og:url"
        property="og:url"
        content={`https://onda.finance/${url}`}
      />
      {image && <meta key="og:image" property="og:image" content={image} />}

      <meta key="twitter:title" property="twitter:title" content={title} />
      <meta
        key="twitter:description"
        property="twitter:description"
        content={description}
      />
      <meta
        key="twitter:url"
        property="twitter:url"
        content={`https://onda.finance/${url}}`}
      />
      <meta
        key="twitter:card"
        property="twitter:card"
        content="summary_large_image"
      />
      {image && (
        <meta key="twitter:image" property="twitter:image" content={image} />
      )}
      {imageAlt && (
        <meta
          key="twitter:image:alt"
          property="twitter:image:alt"
          content={imageAlt}
        />
      )}
      {twitterLabels.map(({ label, value }, index) => (
        <Fragment key={label}>
          <meta
            key={`twitter:label${index + 1}`}
            property={`twitter:label${index + 1}`}
            content={label}
          />
          <meta
            key={`twitter:data${index + 1}`}
            property={`twitter:data${index + 1}`}
            content={value}
          />
        </Fragment>
      ))}
    </Head>
  );
};
