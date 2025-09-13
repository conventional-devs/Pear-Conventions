---
title: Multi-Writer
---

Autobase; HyperBee, HyperDB etc.

Explain how Hyperdispatch can make this cleaner and safer

# Autobase

## The `apply` function

The `apply` function is the heart of Autobase. It gives you a view into the current state of the Autobase, and lets you update it.

:::caution
This function should be treated like a cloud function. What happens inside `apply` should not touch what happens _outside_ of `apply`. `this.autobase.view != apply view`
:::

When you `append` to an Autobase, your input is passed to the `apply` function.

```js
async function apply (nodes, view, host) {
  for (const { value } of nodes) {
    if (value.addWriter) {
      await host.addWriter(value.addWriter, { indexer: true })
      continue
    }

    await view.append(value)
  }
}
```

### Migrating

A super smart way to migrate your `apply` function to new versions without breaking existing clients is to use [bare-union-bundle](https://github.com/holepunchto/bare-union-bundle).

This allows you to keep your old `apply` code, develop new code -> and serve both of these depending on the version needed.

:::note
Different versions of Autobasic logic are often referred to as `contracts`
:::

Let's run through an example.

```js
const UnionBundle = require('bare-union-bundle')

const b = UnionBundle.require('./contract1.bundle', './contract2.bundle')

//--- Lots of other code
//
async function apply (nodes, view, host) {
  for (const { value } of nodes) {
    const {contractVersion,..data} = value

    // or some logic to decide which version to use

    const contract = b.load(new URL('file://root-of-project'), 'apply.js', contractVersion)

    contract.apply(data)
  }
}
```

:::note
This is one potential approach. Alternatively, you may want to encompass your whole Autobase and DB logic in a single "contract".
:::

__examples needed__

## Re-creating a deleted Autobase

:::danger
Don't re-use keys
:::

If you were to delete your local storage of a Pear app using [Autobase](/reference/autobase); but still had the keys for that [Autobase](/reference/autobase) available - **you should not re-use these** to re-join the [Autobase](/reference/autobase).

The way to handle the case where an [Autobase](/reference/autobase) writer loses its storage is:
- The remaining writers remove the lost writer
- The remaining writers add a new writer (with a new private key)
- The new writer can now once again write to the [Autobase](/reference/autobase)
