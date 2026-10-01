export function TextIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M13 6V21H11V6H5V4H19V6H13Z" />
    </svg>
  );
}
