import platform from "platform";

export function isSupportedPlatform(p = platform, query: any) {
  if (query.expo) return true
  return p.name?.startsWith(getSupportedPlatform());
}

export function getSupportedPlatform(p = platform) {

  switch (p.os?.family) {
    case "iOS":
      return "Safari";
    default:
      return "Chrome";
  }
}
