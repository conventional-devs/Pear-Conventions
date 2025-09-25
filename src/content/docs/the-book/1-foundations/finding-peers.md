---
title: Finding Peers
---


## The Basics

There are two main ways of using holepunching to find and connect with peers: Hyperdht and Hyperswarm. While both have use cases they are better suited towards, Hyperswarm abstracts away some of the complexities of Hyperdht. Let's dig into both.


## What is HyperDHT?

HyperDHT is a distributed hash table (DHT) that powers Hyperswarm and is built on top of dht-rpc. It serves as a peer-to-peer networking layer designed to facilitate finding and connecting to peers using end-to-end encrypted connections. The key innovation is that peers are identified by public keys rather than IP addresses, allowing connections regardless of network location or when peers move between networks.

## How it Works

HyperDHT uses several core mechanisms:

1. **Peer Identification**: Instead of IP addresses, peers are identified by cryptographic public keys, making connections location-independent
2. **Holepunching**: Uses UDP holepunching techniques to establish connections even through NATs and firewalls on most networks
3. **Encrypted Streams**: All connections use end-to-end encrypted Noise streams for security
4. **Bootstrapping**: Uses default bootstrap servers to join the network, though isolated networks can be created
5. **Announcement/Discovery**: Peers can announce themselves under topics and others can look up peers by those topics. Peers can even directly connect to another peer if they know their public key.

## Basic Usage

### Installation and Setup

```javascript
npm install hyperdht

const DHT = require('hyperdht')
const node = new DHT()
```

### Creating Key Pairs

```javascript
// Generate a new key pair
const keyPair = DHT.keyPair()
// Returns: { publicKey: Buffer, secretKey: Buffer }

// Or generate from a seed for reproducibility
const keyPair = DHT.keyPair(seed)
```

### Creating a Server (Accepting Connections)

```javascript
// Create a server that accepts incoming connections
const server = node.createServer((socket) => {
  console.log('New connection from:', socket.remotePublicKey)
  // Handle the encrypted socket connection
})

// Listen on a key pair
await server.listen(keyPair)
console.log('Server listening on public key:', keyPair.publicKey)
```

### Connecting to Peers

```javascript
// Connect directly to a remote peer using their public key
const remotePublicKey = Buffer.from('public key of remote peer', 'hex')
const socket = node.connect(remotePublicKey)

socket.on('open', () => {
  console.log('Connected to remote peer')
  // Now you can use the socket to send/receive data
})
```

### Peer Discovery

```javascript
// Announce yourself under a topic
const topic = Buffer.alloc(32, 'my-app-topic') // 32-byte topic
const announceStream = node.announce(topic, keyPair)

// Look for peers under a topic
const lookupStream = node.lookup(topic)
lookupStream.on('data', (data) => {
  // data.peers contains array of peers with their public keys
  data.peers.forEach(peer => {
    // Connect to discovered peers
    const socket = node.connect(peer.publicKey)
  })
})
```

### Complete Example

```javascript
const DHT = require('hyperdht')

// Create two DHT nodes
const node1 = new DHT()
const node2 = new DHT()

// Generate key pairs
const keyPair1 = DHT.keyPair()
const keyPair2 = DHT.keyPair()

// Node 1: Create server
const server = node1.createServer((socket) => {
  console.log('Server received connection')
  socket.write('Hello from server!')
})

await server.listen(keyPair1)

// Node 2: Connect to server
const socket = node2.connect(keyPair1.publicKey)
socket.on('open', () => {
  console.log('Client connected to server')
})

socket.on('data', (data) => {
  console.log('Received:', data.toString())
})
```

## Key Features

- **Firewall Support**: Built-in UDP holepunching works through most home networks and firewalls
- **Location Independence**: Public key addressing means peers can move networks without losing connectivity  
- **Automatic Announcements**: Servers automatically reannounce themselves periodically
- **Topic-based Discovery**: Use 32-byte topics to organize and discover related peers
- **Mutable/Immutable Storage**: Can store both immutable (hash-addressed) and mutable (public key-addressed) data
- **Bootstrap Flexibility**: Can use default public bootstrap servers or create isolated networks

HyperDHT essentially provides a decentralized way to establish secure peer-to-peer connections without requiring central servers or static IP addresses, making it ideal for building distributed applications.

## What is Hyperswarm?

Hyperswarm is a high-level peer-to-peer networking library that simplifies discovering and connecting to peers who share a common "topic" (any 32-byte identifier). It abstracts away the complexities of the underlying HyperDHT and SecretStream modules, providing a simple interface using public keys instead of IP addresses.

## How it Works

Hyperswarm operates on a client-server model within a distributed network:

1. **Topic-based Discovery**: Peers join topics (32-byte buffers) to find others with shared interests
2. **Client-Server Architecture**: 
   - **Servers** announce themselves to the DHT and accept incoming connections
   - **Clients** query the DHT to find servers and connect to them
3. **Connection Management**: Automatically handles reconnections, connection limits, and peer discovery
4. **Transport Layer**: Uses UDX (a custom transport protocol) with advanced UDP holepunching for fast, reliable connections
5. **Encryption**: All connections are end-to-end encrypted using Noise protocol

## Basic Usage

### Installation and Setup

```javascript
npm install hyperswarm

const Hyperswarm = require('hyperswarm')
const swarm = new Hyperswarm()
```

### Creating a Swarm Instance

```javascript
const swarm = new Hyperswarm({
  keyPair: myKeyPair,        // Optional: custom key pair
  maxPeers: 100,             // Optional: max connections (default varies)
  firewall: (remotePublicKey) => false  // Optional: connection filter
})
```

### Joining a Topic (Basic Pattern)

```javascript
// Create a 32-byte topic (often a Hypercore discovery key)
const topic = Buffer.alloc(32, 'my-app-topic')

// Join as both client and server (default behavior)
const discovery = swarm.join(topic)

// Handle new connections
swarm.on('connection', (socket, peerInfo) => {
  console.log('Connected to peer:', peerInfo.publicKey.toString('hex'))
  
  // Use socket as a regular duplex stream
  socket.write('Hello peer!')
  socket.on('data', data => {
    console.log('Received:', data.toString())
  })
})
```

### Client vs Server Modes

```javascript
const topic = Buffer.alloc(32, 'my-topic')

// Join as server only (announce and accept connections)
swarm.join(topic, { client: false, server: true })

// Join as client only (discover and connect to servers)  
swarm.join(topic, { client: true, server: false })

// Join as both (default)
swarm.join(topic) // equivalent to { client: true, server: true }
```

### Direct Peer Connections

```javascript
// Connect directly to a known peer by their public key
const peerPublicKey = Buffer.from('peer-public-key-hex', 'hex')
swarm.joinPeer(peerPublicKey)

// Stop direct connections to a peer
swarm.leavePeer(peerPublicKey)
```

### Managing Topics

```javascript
// Leave a topic (stops discovery, doesn't close existing connections)
await swarm.leave(topic)

// Wait for all pending connections and announcements
await swarm.flush()

// Check current discovery status for a topic
const discovery = swarm.status(topic)
if (discovery) {
  await discovery.flushed() // Wait for full announcement to DHT
}
```

### Complete Example

```javascript
const Hyperswarm = require('hyperswarm')
const crypto = require('crypto')

// Create two swarm instances
const swarm1 = new Hyperswarm()
const swarm2 = new Hyperswarm()

// Shared topic
const topic = crypto.randomBytes(32)

// Swarm 1: Act as server
swarm1.join(topic, { server: true, client: false })
swarm1.on('connection', (socket, peerInfo) => {
  console.log('Server: New connection from', peerInfo.publicKey.toString('hex'))
  socket.write('Hello from server!')
})

// Swarm 2: Act as client  
swarm2.join(topic, { server: false, client: true })
swarm2.on('connection', (socket, peerInfo) => {
  console.log('Client: Connected to server')
  socket.on('data', data => {
    console.log('Client received:', data.toString())
  })
})
```

### Working with PeerInfo

```javascript
swarm.on('connection', (socket, peerInfo) => {
  console.log('Peer public key:', peerInfo.publicKey.toString('hex'))
  console.log('Associated topics:', peerInfo.topics) // Only populated in client mode
  console.log('Is prioritized:', peerInfo.prioritized)
  
  // Ban a peer (prevents future reconnections)
  // peerInfo.ban(true)
})
```

### Monitoring Swarm State

```javascript
swarm.on('update', () => {
  console.log('Connecting:', swarm.connecting)
  console.log('Total connections:', swarm.connections.size)
  console.log('Known peers:', swarm.peers.size)
})

// Access swarm properties
console.log('Active connections:', swarm.connections)
console.log('All peers:', swarm.peers) // Map of publicKey -> PeerInfo
console.log('Underlying DHT:', swarm.dht)
```

## Key Features

- **Simplified API**: Abstracts complex DHT operations into simple join/leave methods
- **Automatic Reconnection**: Handles peer reconnections and network failures automatically
- **Efficient Transport**: Uses UDX protocol optimized for holepunched connections
- **Connection Management**: Built-in connection limits and firewall capabilities
- **Topic Multiplexing**: Multiple topics can share the same connection to a peer
- **Direct Connections**: Can establish direct peer connections using public keys
- **Privacy-Preserving**: Advanced holepunching algorithm minimizes metadata leakage

## Common Use Cases

1. **Hypercore Replication**: Join using a Hypercore's discovery key to find replication peers
2. **Chat Applications**: Peers join a topic to discover others in the same chat room
3. **File Sharing**: Share files by having peers join a topic representing the file hash
4. **Gaming**: Players join topics representing game sessions
5. **IoT Networks**: Devices join topics to discover and communicate with related devices

Hyperswarm essentially provides a simple, robust way to build peer-to-peer applications without worrying about the underlying networking complexities, making distributed application development much more accessible. While there are many use cases for both Hyperswarm and Hyperdht, which one is right for your app use case will vary. That being said, more often than not Hyperswarm provides simplicity and robustness needed for most use cases.