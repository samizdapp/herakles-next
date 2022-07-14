// @ts-ignore
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function HarnessedPage() {
  const {
    query: { dir },
  } = useRouter();

  // const [host, setHost] = useState("localhost");
  // useEffect(() => setHost(window.location.hostname), []);
  // console.log("dirhost", dir, host);

  return (
    <iframe
      src={`/harness/${dir}/`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: "100%",
        height: "100%",
        border: "none",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        zIndex: 999999,
      }}
    />
  );
}
