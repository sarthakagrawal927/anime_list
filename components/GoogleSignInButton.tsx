"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme?: string; size?: string; text?: string; shape?: string; width?: number }
          ) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton() {
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !buttonRef.current) return;

    const initGoogle = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            await login(response.credential);
          } catch (err) {
            console.error("Login failed:", err);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "medium",
        text: "signin_with",
        shape: "rectangular",
      });
    };

    if (window.google) {
      initGoogle();
    } else {
      // Wait for Google script to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [login]);

  return <div ref={buttonRef} />;
}
