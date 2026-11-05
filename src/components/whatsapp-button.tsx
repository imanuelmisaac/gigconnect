import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps extends ButtonProps {
  phoneNumber: string;
  message?: string;
  iconOnly?: boolean;
}

export function WhatsAppButton({ 
  phoneNumber, 
  message = '', 
  className, 
  children, 
  iconOnly = false,
  variant = "outline",
  onClick,
  ...props 
}: WhatsAppButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Sanitize phone number (remove any non-digit characters)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Call external onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("gap-2", className)}
      onClick={handleClick}
      {...props}
    >
      <MessageCircle className={cn("h-4 w-4", iconOnly ? "" : "mr-1")} />
      {!iconOnly && (children || "Contact via WhatsApp")}
    </Button>
  );
}
