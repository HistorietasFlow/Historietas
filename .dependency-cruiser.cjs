/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "warn",
      comment:
        "Dependências circulares aumentam o acoplamento e podem causar problemas de inicialização e manutenção.",
      from: {
        path: "^(app|components|lib)/",
      },
      to: {
        circular: true,
        dependencyTypesNot: ["type-only"],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: ["node_modules"],
    },
    parser: "swc",
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
