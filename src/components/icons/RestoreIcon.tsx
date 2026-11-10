export function RestoreIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M9 5h10v10h-2V7H9V5Zm-4 4h10v10H5V9Zm2 2v6h6v-6H7Z" />
    </svg>
  );
}
