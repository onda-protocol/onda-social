import Image from "next/image";

interface AvatarProps {
  name: string;
  image: string;
  size?: number;
}

export const Avatar = ({ name, image, size = 24 }: AvatarProps) => {
  return (
    <Image
      height={size}
      width={size}
      alt={name}
      src={image}
      style={{
        borderRadius: "100%",
        objectFit: "cover",
      }}
    />
  );
};
