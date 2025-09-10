---
title: Database and Schema
description: Learn about HyperDB and HyperSchema, two powerful tools for building decentralized databases.
---

[HyperDB](www.npmjs.com/package/hyperdb) and [HyperSchema](www.npmjs.com/package/hyperschema) build upon the Pear foundations to bring something approaching a true database.

To name a few, `HyperDB` gives us:
* Scheme-based data - a fixed structure that defines it's format and storage.
* Single and composite keys - query data by the value of one or more fields.
* Indexes - with ability to defined unique keys, and transform queries (such as converting to lower case).
* Real-time changes - listen for changes in your data.

:::note
A field must be listed as a key, or have an index to be used in queries.
:::

We'll break these features down, as they introduce a lot of new concepts.

For now:

```js
import HyperDB from 'hyperdb'
import Hypercore from 'hypercore'
import def from './spec/hyperdb/index.js'

// first choose your engine
const core = new Hypercore('/path/to/hypercore')
const db = HyperDB.bee(core, def)

// Add some entries
await db.insert('@example/members', { name: 'maf', age: 37 })
await db.insert('@example/members', { name: 'sean', age: 36 })
await db.flush() // commit changes

// Query collection
const maf = await db.get('@example/members', { name: 'maf' })
console.log('maf', maf)
```

Where did `@example` come from? Can I query by age? Flush?...

Let's start from the beginning

## Schemas

## Usage

## Versioning and Migrations

TBD
