declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HUE_USERNAME: string;
      HUE_HOST: string;
      PREFIX: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
