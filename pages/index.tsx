import { useEffect, useState } from "react";
import HomeLayout from "../layouts/home";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import { GetServerSideProps } from "next";
import { isSupportedPlatform } from "../lib/support";
import platform from "platform";

export default function Home() {
  return (
    <HomeLayout>
      <Card>
        <h1>Welcome update</h1>
      </Card>
    </HomeLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const p = platform.parse(context.req.headers["user-agent"]);
  const supported = isSupportedPlatform(p);
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
