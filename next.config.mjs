const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: isGitHubPages,
  },
};

export default nextConfig;
