import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ErrorState, errorMessages, ErrorInfo } from "@/lib/errorTypes"
import { AlertCircle, XCircle, Info, WifiOff, Shield, Clock, FileX, Zap } from "lucide-react";

function getIcon(type: ErrorState) {
  switch (type) {
    case 'expiredLink':
    case 'sessionExpired':
      return <Clock className="h-4 w-4" />;
    case 'invalidLink':
    case 'notFound':
      return <FileX className="h-4 w-4" />;
    case 'accessDenied':
    case 'forbidden':
    case 'unauthorized':
      return <Shield className="h-4 w-4" />;
    case 'networkError':
    case 'connectionLost':
      return <WifiOff className="h-4 w-4" />;
    case 'serverError':
    case 'serviceUnavailable':
    case 'maintenanceMode':
      return <AlertCircle className="h-4 w-4" />;
    case 'accountSuspended':
    case 'rateLimitExceeded':
      return <XCircle className="h-4 w-4" />;
    case 'validationError':
    case 'uploadError':
    case 'downloadError':
      return <Zap className="h-4 w-4" />;
    case 'paymentRequired':
      return <Info className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

function getVariant(type: ErrorState): 'default' | 'destructive' {
  switch (type) {
    case 'expiredLink':
    case 'invalidLink':
    case 'accessDenied':
    case 'forbidden':
    case 'unauthorized':
    case 'serverError':
    case 'accountSuspended':
    case 'validationError':
    case 'uploadError':
    case 'downloadError':
      return 'destructive';
    default:
      return 'default';
  }
}

function getBorderColor(type: ErrorState) {
  switch (type) {
    case 'expiredLink':
    case 'invalidLink':
    case 'accessDenied':
    case 'forbidden':
    case 'unauthorized':
    case 'accountSuspended':
    case 'validationError':
    case 'uploadError':
    case 'downloadError':
      return "border-red-200 dark:border-red-800";
    case 'networkError':
    case 'connectionLost':
    case 'serverError':
    case 'serviceUnavailable':
    case 'maintenanceMode':
    case 'rateLimitExceeded':
      return "border-orange-200 dark:border-orange-800";
    case 'sessionExpired':
    case 'notFound':
    case 'paymentRequired':
      return "border-blue-200 dark:border-blue-800";
    default:
      return "border-gray-200 dark:border-gray-800";
  }
}

function getBackgroundColor(type: ErrorState) {
  switch (type) {
    case 'expiredLink':
    case 'invalidLink':
    case 'accessDenied':
    case 'forbidden':
    case 'unauthorized':
    case 'accountSuspended':
    case 'validationError':
    case 'uploadError':
    case 'downloadError':
      return "bg-red-50 dark:bg-red-950";
    case 'networkError':
    case 'connectionLost':
    case 'serverError':
    case 'serviceUnavailable':
    case 'maintenanceMode':
    case 'rateLimitExceeded':
      return "bg-orange-50 dark:bg-orange-950";
    case 'sessionExpired':
    case 'notFound':
    case 'paymentRequired':
      return "bg-blue-50 dark:bg-blue-950";
    default:
      return "bg-gray-50 dark:bg-gray-950";
  }
}

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

interface ErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  errorInfo: ErrorInfo;
}

const ErrorAlert: React.FC<ErrorProps> = ({
  errorInfo,
  className,
  ...props
}) => {
  const { type, message, details } = errorInfo;
  const variant = getVariant(type);
  const borderColor = getBorderColor(type);
  const backgroundColor = getBackgroundColor(type);
  
  return (
    <Alert
      variant={variant}
      className={cn(
        "flex flex-row items-start space-x-3 p-4",
        borderColor,
        backgroundColor,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <AlertTitle className="text-sm font-semibold mb-1">
          {message || errorMessages[type]}
        </AlertTitle>
        {details && (
          <AlertDescription className="text-xs text-muted-foreground">
            {details}
          </AlertDescription>
        )}
      </div>
    </Alert>
  );
};

export { Alert, AlertTitle, AlertDescription, ErrorAlert }
