import HomeLayout from "../layouts/home";
import { GetServerSideProps } from "next";
import { isSupportedPlatform } from "../lib/support";
import platform from "platform";
import Storage from "herakles-lib/dist/storage.web";
import { useEffect, useState } from "react";

export default function Home() {
  const [res, setRes] = useState("waiting");
  useEffect(() => {
    const s = new Storage("next");
    console.log("aldkfjald");
    s.setItem("test", { payload: "test" })
      .then((_r: any) => s.getItem("test"))
      .then((val: any) => setRes(val));
  }, []);
  return (
    <HomeLayout>
      <h1>Index: {JSON.stringify(res)}</h1>
    </HomeLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const p = platform.parse(context.req.headers["user-agent"]);
  const supported = isSupportedPlatform(p, context.query);
  if (!supported) {
    return {
      redirect: {
        destination: "/setup/unsupported",
        permanent: false,
      },
    };
  }

  const hostname = context.req.headers.host;
  if (hostname === "setup.local") {
    const guide = p.name === "Safari" ? "safari" : "chrome";
    return {
      redirect: {
        destination: `/setup/${guide}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
