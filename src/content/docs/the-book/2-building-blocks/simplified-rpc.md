---
title: Simplified RPC
---

RPC can be a lot to manage. Keeping track of requests and responses can be challenging; as simply for the developer - WHAT is GOING WHERE?

Let's build up the basics to see how we can approach this. Feel free to skip to [the end](#hrpc-to-the-rescue)

## IPC
A simple example of this in React Native [Bare Expo](/reference/bare-expo) uses just pure IPC (inter process communication):

```js
import { useState, useEffect } from 'react'
import { Text } from 'react-native'
import { Worklet } from 'react-native-bare-kit'
import b4a from 'b4a'

export default function () {
  const [response, setResponse] = useState<string | null>(null)

  useEffect(() => {
    const worklet = new Worklet()

    const source = `
    const { IPC } = BareKit

    IPC.on('data', (data) => console.log(data.toString()))
    IPC.write(Buffer.from('Hello from Bare!'))
    `

    worklet.start('/app.js', source)

    const { IPC } = worklet

    IPC.on('data', (data: Uint8Array) => setResponse(b4a.toString(data)))
    IPC.write(b4a.from('Hello from React Native!'))
  }, [])

  return <Text>{response}</Text>
}
```

What we see here is the ability to run code - via the `Worklet` class (basically ask Bare to run some JavaScript code for us).

We have two way communication with Bare; good times!

## More power! (RPC)

Turning this into something real world, we ideally want to make our life easier in two ways. First; not writing Javascript in a string variable. And second; reacting to specific messages.

The first one is simply done.

### 1. Bundling
Using [bare-pack](https://npmjs.com/package/bare-pack) we can prepare our code as a bundle:

```sh
npx bare-pack --target ios --target android  --linked --out app.bundle.mjs bestcode.mjs
```

This bundles up our `bestcode.mjs` into `app.bundle.mjs`; along with our dependencies. Ready for use!
We'll look at these bundles more later in `contracts` (TBD).

Finally, we load it in:

```diff
-const source = `
-const { IPC } = BareKit
-
-IPC.on('data', (data) => console.log(data.toString()))
-IPC.write(Buffer.from('Hello from Bare!'))
-`
-
-worklet.start('/app.js', source)
+import bundle from './app.bundle.mjs'
+worklet.start('/app.bundle', bundle)
```

Now are code is nice and tidy, how can we make it even better?

### 2. Listening to messages

[bare-rpc](https://npmjs.com/package/bare-rpc) lets us take this a step further. RPC (remote procedure calls) are a way to call specific functions. We receive messages with a `command` and `data` payload.

Commands are just numbers. So it's best to define these as constants for ease of use between the `Expo` side and the `Bare` side

As explored in the [official example](https://docs.pears.com/guides/making-a-bare-mobile-app), we can define the commands like this:

`commands.mjs`
```js
export const RPC_RESET = 0
export const RPC_MESSAGE = 1
```

Alternatively, an object can be used:

`commands.mjs`
```js
export const RPC = {
  RESET: 0,
  MESSAGE: 1,
}
```

Or if you're using TypeScript, you can define an enum:

`commands.ts`
```ts
export enum RPC {
  RESET = 0,
  MESSAGE = 1,
}
```

Either way, we're left with something we can trust.

You can follow the rest of the guide on Bare expo in the [official example](https://docs.pears.com/guides/making-a-bare-mobile-app) to see how those commands are used.

For now, a quick snippet of how to listen to messages:

```js
const rpc = new RPC(IPC, (req) => {
    // Handle incoming RPC requests
    if (req.command === RPC_MESSAGE) {
        console.log(req.data.toString())
    }
})

const req = rpc.request(RPC_MESSAGE)
req.send(Buffer.from('Hello from Bare!'))
```

It works, but it's not something that will scale well.

## HRPC to the rescue

[hrpc](https://npmjs.com/package/hrpc) is a higher level implementation, giving you friendly API with no surprises.

Let's take a look at our original example with our bundle:

```js
import { useState, useEffect, useRef, useCallback } from 'react'
import { Text } from 'react-native'
import { Worklet } from 'react-native-bare-kit'
import bundle from './app.bundle.mjs'
import HRPC from './spec/hrpc' // <-- We'll get to that in a sec
import b4a from 'b4a'

export default function () {
  const rpc = useRef(null)

  const onClick = useCallback(() => {
    // "hello" is made magically available for us?!
    rpc.current.hello({ world: 'World' })
  }, [])

  useEffect(() => {
    const worklet = new Worklet()
    worklet.start('/app.bundle', bundle)

    const { IPC } = worklet

    // We'll set this as ref so we can use it later
    // In the real world, a React Context would be used to share the RPC instance across components
    rpc.current = new HRPC(IPC)

    // onHello is also made magically available for us?!
    rpc.current.onHello((data) => {
      return {
        message: `Hello ${data.world}, from Expo!`
      }
    })
  }, [])

  return <Text onPress={onClick}>{response}</Text>
}
```

Inside out `app.bundle.mjs` we'll see something quite similar; here's a snippet:

```js
import HRPC from '../spec/hrpc'
const { IPC } = BareKit // Bare gives us this for free
const rpc = new HRPC(IPC)

rpc.onHello((data) => {
  return {
    message: `Hello ${data.world}, from Bare!`
  }
})

rpc.hello({ world: 'New world' })
```

This might seem like magic. But what we're getting here is due to HRPC _generating_ code for us to use!
That's why we're importing from `./spec/hrpc.js`; and not `hrpc` as you may expect.

**TBD**: We'll discuss how to setup HRPC using [hyperschema](https://npmjs.com/package/hyperschema).

For now, here's a schema!

`./schema.js`
```js
const HRPCBuilder = require('hrpc')
const Hyperschema = require('hyperschema')
const path = require('path')

const SCHEMA_DIR = path.join(__dirname, 'spec', 'hyperschema')
const HRPC_DIR = path.join(__dirname, 'spec', 'hrpc')

// register schema
const schema = Hyperschema.from(SCHEMA_DIR)
const schemaNs = schema.namespace('example')

schemaNs.register({
  name: 'hello-request',
  fields: [
    { name: 'world', type: 'string' }
  ]
})

schemaNs.register({
  name: 'hello-response',
  fields: [
    { name: 'message', type: 'string' }
  ]
})
Hyperschema.toDisk(schema)

// Load and build interface
const builder = HRPCBuilder.from(SCHEMA_DIR, HRPC_DIR)
const ns = builder.namespace('my-app')

// Register commands
ns.register({
  name: 'hello',
  request: { name: '@my-app/hello-request', stream: false },
  response: { name: '@my-app/hello-response', stream: false }
})

// Save interface to disk
HRPCBuilder.toDisk(builder)
```


We build this schema to get the generated code out:

```sh
node ./schema.js
```

This will generate code in `./spec/hrpc`. And away we go!

**TBD**
