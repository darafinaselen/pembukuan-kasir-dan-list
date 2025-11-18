import { Spinner } from "./spinner";

function LoadingOverlay({
  isVisible,
  message = "Memproses...",
  className = "",
  spinnerSize = "md",
  ...props
}) {
  if (!isVisible) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg border ${className}`}
      {...props}
    >
      <Spinner size={spinnerSize} className="mb-2" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

export { LoadingOverlay };