import React from "react";
import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";

export function ErrorDisplay({
  error,
  onRetry,
  title = "Terjadi Kesalahan",
  description,
  showDetails = false,
  showRetry = true,
  variant = "default",
  className = "",
}) {
  const isNetworkError = error?.message?.includes("fetch") ||
                        error?.message?.includes("network") ||
                        error?.code === "NETWORK_ERROR";

  const getErrorIcon = () => {
    if (isNetworkError) {
      return <WifiOff className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getErrorDescription = () => {
    if (description) return description;

    if (isNetworkError) {
      return "Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.";
    }

    return "Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.";
  };

  return (
    <Alert variant={variant} className={className}>
      {getErrorIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{getErrorDescription()}</p>

        {showDetails && error && (
          <details className="mt-2 mb-4">
            <summary className="cursor-pointer text-sm font-medium">
              Detail Error
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {error.toString()}
              {error.stack && (
                <>
                  {"\n\n"}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}

        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function InlineError({
  error,
  onRetry,
  message,
  className = "",
}) {
  if (!error) return null;

  return (
    <div className={`text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{message || error.message || "Terjadi kesalahan"}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}