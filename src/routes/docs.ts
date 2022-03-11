import { version } from "../../package.json";

const swaggerOptions = {
  info: {
    version,
    title: "Effective Altruism UW\u2013Madison API",
    description:
      "API for Effective Altruism UW\u2013Madison website and other services. \
        Facilitates newsletter sign-ups, sending emails, listing events, and more.",
    contact: {
      name: "Effective Altruism UW\u2013Madison",
      url: "https://eauw.org/",
      email: "contact@eauw.org"
    },
    license: {
      name: "Unlicense",
      url: "https://unlicense.org/"
    }
  },
  servers: [
    { url: "http://localhost:3000", description: "Development server" },
    { url: "https://api.eauw.org", description: "Production server" }
  ],
  baseDir: __dirname,
  filesPattern: "*.+(ts|js)",
  exposeSwaggerUI: true,
  swaggerUIPath: "/docs",
  exposeApiDocs: true,
  apiDocsPath: "/swagger.json",
  notRequiredAsNullable: false
};

export default swaggerOptions;
