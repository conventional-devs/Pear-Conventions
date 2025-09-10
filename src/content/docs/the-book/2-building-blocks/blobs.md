---
title: Blobs
description: Blobs, drives and storage in your Pear app.
---

Pear is Hypercores and Buffers all the way down.

![Hypercores](/memes/hypercores.jpg)

So you could store your files directly into a [Hypercore](/reference/hypercore) using:

```js
import { Hypercore } from 'hypercore'

const core = new Hypercore('/path/to/hypercore')
await core.ready()

await core.append(Buffer.from('I am a block of data')) // returns new length of the core, so you should be able to figure out the index of your data
```

However, there are limits on how much data can be stored in a single block ([add reference]()).

Things brings us to chunking data. However, this brings the added complexity of managing multiple blocks.

## Enter Hyperblobs

[Hyperblobs](https://github.com/holepunchto/hyperblobs/tree/main) simplifies this process by providing a simple API for storing and retrieving large amounts of data.

Putting data returns an ID that can be used to retrieve the data later. The ID is a simple object containing the start, end and length of the data (among other things).

```js
import { Hyperblobs } from 'hyperblobs'

const core = new Hypercore('/path/to/hypercore')
const blobs = new Hyperblobs(core)
await blobs.ready()

const id = await blobs.put(Buffer.from('hello world', 'utf-8'))
await blobs.get(id)
```

This is a solid solution for "object storage" in **Pear**. It allows you to store and retrieve large amounts of data in a simple and efficient way. Pulling blocks from Peers via our Hypercore like normal.

The final layer we have is files. What if I want to easily store and retrieve files? Files are just bigger Buffers, but with extra meta. I want to know the file name for example. For that we just need to store the `Blob ID` in a KV store or a database right?

### Enter Hyperdrive

No rewards for guessing what this does. [Hyperdrive](https://docs.pears.com/building-blocks/hyperdrive) contains a KV store (aka [Hyperbee](/the-book/building-blocks/key-value-store)) with meta.

Hyperdrive does take this a step further, providing a lot of the functionality you would expect from `fs`; such as getting, putting and deleting files - but also checking if a file exists; and `mirroring` the drive to another drive.

Helpers such as [localdrive](https://docs.pears.com/helpers/localdrive) and [mirrordrive](https://docs.pears.com/helpers/mirrordrive) help make Hyperdrive even more powerful. With easy copying of data to a local folder, another drive, or between local folders.

:::note
Remember, if you're not interested in having files automatically shared between Peers, Hyperdrive is not the tool you need.
:::
