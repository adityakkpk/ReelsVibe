"use client";

import { ImageKitProvider } from "imagekitio-next";
import { SessionProvider } from "next-auth/react";

const publickey = process.env.IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit-auth");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`
        Request failed with status ${response.status}: ${errorText}
        `);
    }

    const data = await response.json();
    const { signature, token, expire } = data;
    return { signature, token, expire };
  } catch (error) {
    console.error("Error fetching ImageKit authentication data:", error);
    throw new Error("Failed to authenticate with ImageKit");
  }
};

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ImageKitProvider
        urlEndpoint={urlEndpoint}
        publicKey={publickey}
        authenticator={authenticator}
      >
        {children}
      </ImageKitProvider>
    </SessionProvider>
  );
}