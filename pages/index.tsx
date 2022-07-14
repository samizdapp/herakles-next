import HomeLayout from "../layouts/home";
import { GetServerSideProps } from "next";
import { isSupportedPlatform } from "../lib/support";
import platform from "platform";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    (async () => {
      while (navigator.serviceWorker.controller?.state !== "activated")
        await new Promise((r) => setTimeout(r, 10));
      window.location.reload();
    })();
  });
  return (
    <HomeLayout>
      <h1>Home</h1>
    </HomeLayout>
  );
}
