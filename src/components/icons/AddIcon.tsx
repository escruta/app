export function AddIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" />
    </svg>
  );
}
