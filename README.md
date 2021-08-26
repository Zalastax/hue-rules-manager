# How?

Declarative method for managing Hue rules.
Method of working is to delete all Rules and Sensors created by this software,
followed by recreating them.

# Why?

Compared to writing rules by hand, TypeScript + Hue Node API:

- Uses abstraction to avoid repetition
- Uses named variables - way more readable rules!
- Does not use the API Debug tool

# How to use?

Create a file named .env.  
Provide environment variables:

```
HUE_USERNAME=<Username>
HUE_HOST=<Hue IP>
PREFIX=hue-rules-manager
```

Then run:

```
npm install
npm run start
```
