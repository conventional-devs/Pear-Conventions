---
title: Availability and Seeding
description: Making your data and Pear app available with Blind Peering
---

Keeping your application available means two things in P2P:

* **Data Availability**: Ensure that your _data_ is accessible to all peers in the network. This could be your [Hypercore](/reference/hypercore), [Autobase](/reference/autobase), [HyperDB](/reference/hyperdb) etc.
* **Application Availability**: Ensure that your application is accessible users. A Pear app has a [Hypercore](/reference/hypercore) (meta) and a [Hyperdrive](/reference/Hyperdrive) (the files) these must both be available.

The easy solution to this problem is `seeding`, just like a torrent. Seeding makes the underyling Cores available for download. This can be achieved very easily:

```bash
$ pear seed pear://<app>
```

This must be kept running to ensure your app is available to peers.
Anyone can see your app, but at least one peer must be seeding it for it to be available to run for the first time by a new user.

This has two potential issues:

1. You must have an instance of `pear` running for every app you want to seed.
2. You will only seed Cores you have available. For example a private Keet room won't be seedable by you - as you don't have access to it.

So how do I keep my Direct Messages available without anyone online to seed them?

## Enter Blind Peering

Blind Peer is as the name suggests, a Peer that doesn't see your data, just makes it available for others to download.

It comes in two parts (three if you include the CLI for manually requesting Peering)

### 1. [The Blind Peer](https://github.com/holepunchto/blind-peer)

This is a CLI that you can run as a service.
It listens to requests for Cores to be replicated.

:::note
After startup, it will print out in the logs the hash you need to use for requests.
:::


```toml
[Unit]
Description=Blind Peer
After=network.target

[Service]
ExecStart=/root/.nvm/versions/node/v22.18.0/bin/blind-peer -m 10000 --trusted-peer <your-id>
Restart=always
RestartSec=10
WorkingDirectory=/root
Environment=PATH=/root/.nvm/versions/node/v22.18.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
```

### 2. [Blind Peering Client](https://github.com/holepunchto/blind-peering) - Your Data

The client is what makes requests to the Blind Peer.

You provide the Blind Peer's public key to the client, allowing you to make requests to it. As well as adding Cores to the Blind Peer; there is a helper to add an Autobase directly.

Adding can be done synchronously or asynchronously.

```js
import BlindPeering from 'blind-peering'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Wakeup from 'protomux-wakeup'

const store = new Corestore(Pear.config.storage)
const swarm = new Hyperswarm()
const wakeup = new Wakeup()

const DEFAULT_BLIND_PEER_KEYS = ['your-blind-peer-key']
const blind = new BlindPeering(swarm, store, { wakeup, mirrors: DEFAULT_BLIND_PEER_KEYS })

// Add your autobase
blind.addAutobaseBackground(autobase1)

// Add another core
blind.addCore(core1, autobase1.wakeupCapability.key)
```

:::caution
Synchronous can be slow, prefer asynchronous if your app is not short lived.
:::

:::tip
Consider allowing your users to customise the Blind Peers used. They may not want to use the default ones for privacy reasons - such as location sharing.
:::

### 3. [Blind Peering CLI](https://github.com/holepunchto/blind-peering-cli) - Your Application

The `pear info pear://<app>` command outputs information about your Pear app; including the keys of the Core and Drive needed to share it.

Output looks like this:

```bash
keys         hex
-----------  ------------------------------------------------------------------
 project      3c03f05433bf01a50c1ead05a35405b7fb7e6a0b55bfce961e7c58fcf3f5e831
 discovery    b5aaf41d602869c5a45b3220f15539cf6c6adbaa49ca180677734e82b9b93e41
 content      e8a191becfda08b7abe07581e91886365f1e18d6e012e5e489af87306d191203


 info              value
-----------------  -----------------
 name              pear-browser
 channel           dev
 release           3650
 length            3650
 fork              0
 byteLength        877538
 blobs.length      8619
 blobs.fork        0
 blobs.byteLength  357976565


 changelog [ latest ]
-------------------------------------------------------------------------------
 [ No Changelog ]

✔ Success
```

The `project` and `content` keys are the ones we are after.

Using the Blind Peering CLI, we can request for these to be made available via the Blind Peer.

Seed the App core:
```bash
$ blind-peering seed --core --blind-peer-key <blind-peer-key> <content key>
```

Seed the App drive:
```bash
$ blind-peering seed --drive --blind-peer-key <blind-peer-key> <project key>
```
