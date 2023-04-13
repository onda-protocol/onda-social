import { Container, Box, Grid, GridItem } from "@chakra-ui/layout";

interface GridLayoutProps {
  leftColumn: JSX.Element;
  rightColumn: JSX.Element;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  leftColumn,
  rightColumn,
}) => {
  return (
    <Container maxW="container.lg">
      <Grid templateColumns="1fr 360px" gap="2">
        <GridItem>{leftColumn}</GridItem>
        <GridItem>{rightColumn}</GridItem>
      </Grid>
    </Container>
  );
};
