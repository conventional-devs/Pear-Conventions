---
title: Run, Build, Deploy
---

## Runtime

Node, Pear, Bare

## Package Management

Pear is primarily built with `npm` in mind. Others may work, but are not officially supported.

This is generally down to the fact that `Bare` has it's own functionality for loading dependencies, which Pear also uses for distributing those dependencies along with your app.

This is gives us the potential for some simple rules:

1. Use `node_modules` for dependencies - this lets Pear pick them up during development and deployment.
2. Use `package.json` - you can't escape this, Pear uses it for config.
3. Don't bundle your code or dependencies - you're just making it harder for Pear to manage your dependencies.

### Typescript and Typings

Some parts of the Holepunch stack do have typings included, but not all. There's a community effort to bring typings for everything and add these to the repositories [here](https://github.com/Drache93/holepunch-types). We're starting with a single repo to cover everything to make sure we're happy they cover all the bases.

:::note
Pear is a big beast. Make your life easy and use an IDE that supports Typings. Even with vanilla Javascript, your IDE will still provide you with some level of type checking and autocompletion.
:::

#### Break the rules
Developing with Typescript and Pear is possible. And actually as well as directly using `tsc` to build your Javascript code. `Bun` makes this even easier.

:::caution
Remember we don't want to build dependencies!
:::

To build using Bun, and not include dependencies, you can use the following command:

```bash
bun build index.ts --packages=external --outdir=.
```

Bun also supports a `--watch` flag to watch for changes and rebuild your code automatically:

```bash
bun build index.ts --packages=external --outdir=. --watch
```
