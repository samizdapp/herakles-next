import HomeLayout from "../layouts/home";
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
