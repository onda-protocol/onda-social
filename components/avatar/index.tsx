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
      src={image + "?discriminator=1"}
      style={{
        borderRadius: "100%",
        objectFit: "cover",
      }}
    />
  );
};
