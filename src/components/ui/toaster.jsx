import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useEffect } from "react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, ...props }) {
        return (
          <ToastWithAutoDismiss 
            key={id} 
            id={id}
            title={title}
            description={description}
            action={action}
            duration={duration || 5000}
            dismiss={dismiss}
            {...props}
          />
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastWithAutoDismiss({ id, title, description, action, duration, dismiss, ...props }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      dismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, dismiss]);

  return (
    <Toast {...props}>
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && (
          <ToastDescription>{description}</ToastDescription>
        )}
      </div>
      {action}
      <ToastClose onClick={() => dismiss(id)} />
    </Toast>
  );
} 