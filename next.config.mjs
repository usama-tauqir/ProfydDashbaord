const isGitHubPages =
  process.env.DEPLOY_TARGET === "github-pages";

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";

const isUserOrOrganizationSite =
  repositoryName.endsWith(".github.io");

const basePath =
  isGitHubPages &&
  repositoryName &&
  !isUserOrOrganizationSite
    ? `/${repositoryName}`
    : "";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: isGitHubPages ? "export" : "standalone",

  basePath,

  trailingSlash: isGitHubPages,

  images: {
    unoptimized: isGitHubPages,
  },
};

export default nextConfig;
