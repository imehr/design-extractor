type Props = {
  className?: string;
  alt?: string;
};

export function UniSuperLogo({ className = "h-8 w-auto", alt = "UniSuper logo" }: Props) {
  return (
    <img
      src="/brands/unisuper-com-au/logo.svg"
      alt={alt}
      className={className}
    />
  );
}
