import { useEffect, useState } from "react";
import { CircularIndeterminate } from '../components/progress'


export default function Home() {
  const [supported, setSupported] = useState(true)
  useEffect(() => {
    (async () => {
      if (!navigator.serviceWorker){
        return setSupported(false)
      }
      while (navigator.serviceWorker.controller?.state !== "activated")
        await new Promise((r) => setTimeout(r, 10));
      window.location.reload();
    })();
  });
  return (
    // <HomeLayout>
    <h1><CircularIndeterminate/></h1>
    // </HomeLayout>
  );
}
