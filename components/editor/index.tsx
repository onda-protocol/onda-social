import { Box, Button, Input, Textarea } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

interface PostForm {
  title: string;
  body: string;
}

interface EditorProps {
  onSubmit: (data: PostForm) => void;
}

export const PostEditor = ({ onSubmit }: EditorProps) => {
  const methods = useForm<PostForm>({
    defaultValues: {
      title: "",
      body: "",
    },
  });

  return (
    <Box noValidate as="form" onSubmit={methods.handleSubmit(onSubmit)}>
      <Input
        mt="6"
        {...methods.register("title", {
          required: true,
        })}
      />
      <Textarea
        mt="2"
        placeholder="Hello world"
        {...methods.register("body", { required: true })}
      />
      <Box display="flex" mt="2" justifyContent="right">
        <Button type="submit">Submit</Button>
      </Box>
    </Box>
  );
};
