import { Box, Container, Grid, GridItem } from "@chakra-ui/layout";

interface GridLayoutProps {
  leftColumn: JSX.Element;
  rightColumn: JSX.Element;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  leftColumn,
  rightColumn,
}) => {
  return (
    <Box backgroundColor="onda.1000">
      <Container maxW="container.lg">
        <Grid templateColumns={{ base: "1fr", lg: "1fr 320px" }} gap="2">
          <GridItem>{leftColumn}</GridItem>
          <GridItem hideBelow="lg">{rightColumn}</GridItem>
        </Grid>
      </Container>
    </Box>
  );
};
