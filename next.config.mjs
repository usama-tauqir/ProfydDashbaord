const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split("/")[1] || "";

const isUserSite = repositoryName.endsWith(".github.io");

const basePath =
  isGitHubPages && repositoryName && !isUserSite
    ? `/${repositoryName}`
    : "";

const nextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  basePath,
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: isGitHubPages,
  },
};

export default nextConfig;
