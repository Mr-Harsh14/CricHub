import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "prisma/dev.db"],
  },
];

export default config;
