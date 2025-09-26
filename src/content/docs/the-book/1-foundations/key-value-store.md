---
title: Hyperbee Key-Value Store
---


## What is Hyperbee?

Hyperbee is an append-only B-tree built on top of Hypercore that provides a key-value store API. It's designed for efficient storage and retrieval of data with features like sorted iteration, atomic batch operations, version control, and sparse downloading. Like Hypercore, it follows a single-writer, many-readers model where only the creator (with the private key) can modify the database, but it can be replicated to many readers. To better understand Hyperbee, let's think of it as a filing cabinet with a very particular set of rules.

## The Filing Cabinet Analogy

Picture having a filing cabinet where:

-**You can only add new papers, never erase or modify existing ones** - This is the "append-only" part. If you want to "update" a document, you actually file a completely new version with a note saying "this replaces the old one."

-**The drawers are organized alphabetically, but super efficiently** - This is the "B-tree" part. Instead of one long alphabetical list, you have multiple drawers where each drawer covers a range of letters (ie A-F, G-M, N-S, T-Z). This makes finding things much faster because you only need to search the right drawer.

-**Every paper has a label and contents** - This is the "key-value" part. The label is the "key" (ie "Bob's Phone Number") and the contents are the "value" (ie "123-456-7890").

-**You keep a perfect history of everything** - Since it is append only, you can always go back and see what Bob's phone number was last Tuesday, or see the complete history of all changes to any document.

## Why This Design is Powerful

- **Fast lookups**: Since you can quickly find the right drawer and then the right file, the B-tree structure makes finding data very fast even with millions of entries
- **Perfect history**: Since nothing is ever deleted, you have a complete audit trail
- **Reliable**: Since you only add new information, you can't accidentally corrupt existing data
- **Organized**: Everything stays sorted automatically, making range queries (ie "show me all phone numbers for people whose names start with A-M") very efficient

## How it Works

Hyperbee uses several key concepts:

-**B-tree Structure**: Uses an append-only B-tree for efficient key-value storage and retrieval
-**Embedded Indexing**: Stores the entire B-tree structure within a single Hypercore using embedded indexing
-**Append-Only**: All operations are append-only, creating a complete history of changes
-**Version Control**: Each modification increments a version number, allowing access to historical states
-**Single Writer**: Only one writer per database, but supports unlimited readers through replication
-**Encoding Support**: Flexible key and value encoding (binary, UTF-8, JSON, ASCII)

## Basic Usage

### Installation and Setup

```javascript
npm install hyperbee

const Hyperbee = require('hyperbee')
const Hypercore = require('hypercore')

// Create a Hypercore and wrap it with Hyperbee
const core = new Hypercore('./my-db')
const db = new Hyperbee(core, {
  keyEncoding: 'utf-8',    // Optional: 'ascii', 'utf-8', 'binary'
  valueEncoding: 'json'    // Optional: 'json', 'utf-8', 'binary'
})

await db.ready()
```

### Basic Key-Value Operations

```javascript
// Insert a key-value pair
await db.put('name', 'Alice')
await db.put('age', 30)
await db.put('city', 'New York')

// Get a value
const result = await db.get('name')
console.log(result) // { seq: 0, key: 'name', value: 'Alice' }

// Delete a key
await db.del('age')

// Check if key exists
const deleted = await db.get('age')
console.log(deleted) // null
```

### Compare and Swap (CAS) Operations

```javascript
// CAS for put operations
await db.put('counter', 1)

function cas(prev, next) {
  // Only update if the previous value was 1
  return prev && prev.value === 1
}

await db.put('counter', 2, { cas })
console.log(await db.get('counter')) // { seq: 1, key: 'counter', value: 2 }

// CAS for delete operations  
function deleteCas(prev) {
  return prev && prev.value === 2
}

await db.del('counter', { cas: deleteCas })
```

### Batch Operations

```javascript
// Create a batch for atomic operations
const batch = db.batch()

// Queue multiple operations
await batch.put('user:1', { name: 'Alice', age: 30 })
await batch.put('user:2', { name: 'Bob', age: 25 })
await batch.put('user:3', { name: 'Charlie', age: 35 })
await batch.del('old-key')

// Get from batch before flushing (reads from batch + db)
const user = await batch.get('user:1')

// Commit all operations atomically
await batch.flush()

// Or abort the batch
// await batch.close()
```

### Reading and Iteration

```javascript
// Create a read stream with range options
const stream = db.createReadStream({
  gte: 'user:1',  // Start from this key (inclusive)
  lt: 'user:9',   // End before this key
  limit: 10,      // Maximum number of entries
  reverse: false  // Sort order
})

stream.on('data', (entry) => {
  console.log(entry) // { seq, key, value }
})

// Get first/last entry in a range
const first = await db.peek({ gte: 'user:' })
const last = await db.peek({ lt: 'user:~', reverse: true })
```

### Version Control and History

```javascript
// Get current version
console.log('Current version:', db.version)

// Create a snapshot of current state
const snapshot = db.snapshot()

// Make some changes
await db.put('new-key', 'new-value')

// Checkout a previous version (read-only)
const oldVersion = db.checkout(snapshot.version)
console.log(await oldVersion.get('new-key')) // null (doesn't exist in old version)

// History stream shows all operations
const historyStream = db.createHistoryStream()
historyStream.on('data', (entry) => {
  console.log(entry) // { type: 'put' | 'del', seq, key, value }
})
```

### Watching for Changes

```javascript
// Watch a specific key
const watcher = await db.getAndWatch('config')
console.log('Current value:', watcher.node)

watcher.on('update', () => {
  console.log('Config updated:', watcher.node)
})

// Stop watching
await watcher.close()

// Watch a range of keys
const rangeWatcher = db.watch({ gte: 'user:', lt: 'user:~' })
for await (const [current, previous] of rangeWatcher) {
  console.log('Version changed from', previous.version, 'to', current.version)
  // break; // This will destroy the watcher
}
```

### Sub-databases (Namespaces)

```javascript
// Create namespaced sub-databases
const users = db.sub('users')
const posts = db.sub('posts') 
const config = db.sub('config')

// Operations are isolated by namespace
await users.put('alice', { name: 'Alice', age: 30 })
await posts.put('post-1', { title: 'Hello', content: '...' })
await config.put('theme', 'dark')

// Keys are prefixed automatically
console.log(await users.get('alice')) // { key: 'alice', value: { name: 'Alice', age: 30 } }

// Create nested sub-databases
const userProfiles = users.sub('profiles')
await userProfiles.put('alice', { bio: 'Software developer' })
```

### Diffing Between Versions

```javascript
// Compare two versions
const v1 = db.checkout(1)
const v2 = db.checkout(5)

const diffStream = v2.createDiffStream(v1.version)
diffStream.on('data', (diff) => {
  console.log(diff)
  // {
  //   left: { seq, key, value },  // Entry in v2
  //   right: { seq, key, value }  // Entry in v1 (null if not exists)
  // }
})
```

### Replication

```javascript
// Replicate to another peer (similar to Hypercore)
const stream1 = db.replicate(true)  // Initiator
const stream2 = otherDb.replicate(false) // Responder

stream1.pipe(stream2).pipe(stream1)

// Access underlying Hypercore for more replication options
console.log('Discovery key:', db.discoveryKey)
console.log('Public key:', db.key)
```

### Complete Example

```javascript
const Hyperbee = require('hyperbee')
const Hypercore = require('hypercore')

async function example() {
  // Setup
  const core = new Hypercore('./my-database')
  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })
  
  await db.ready()
  
  // Insert data
  const batch = db.batch()
  await batch.put('users/alice', { name: 'Alice', age: 30 })
  await batch.put('users/bob', { name: 'Bob', age: 25 })  
  await batch.put('config/theme', 'dark')
  await batch.flush()
  
  // Query data
  const alice = await db.get('users/alice')
  console.log('Alice:', alice.value)
  
  // Range query
  const users = []
  for await (const entry of db.createReadStream({ gte: 'users/', lt: 'users/~' })) {
    users.push(entry)
  }
  console.log('All users:', users)
  
  // Watch for changes
  const watcher = db.watch({ gte: 'config/' })
  
  setTimeout(async () => {
    await db.put('config/language', 'en')
  }, 1000)
  
  for await (const [current, previous] of watcher) {
    console.log('Config changed, version:', current.version)
    break
  }
  
  await db.close()
}

example()
```

## Common Use Cases

-**Document Databases**: Store JSON documents with efficient key-based access
-**Configuration Management**: Version-controlled application settings
-**User Profiles**: Namespaced user data with efficient lookups
-**Audit Logs**: Immutable history of all database changes
-**Collaborative Applications**: Replicated databases with conflict resolution
-**Time-series Data**: Efficiently store and query timestamped data
-**File Systems**: Directory-like structures with path-based keys

## Summary

Hyperbee provides a powerful combination of database functionality with the distributed, versioned, and cryptographically secure properties of Hypercore, making it ideal for building decentralized applications that need structured data storage.

## TLDR
Hyperbee is an append-only storage API tool built on top of Hypercore that features:
- **B-tree Efficiency**: Logarithmic time complexity for operations
- **Atomic Batches**: Multiple operations committed atomically
- **Version Control**: Access any previous state of the database
- **Range Queries**: Efficient iteration over key ranges with sorting
- **Live Watching**: Real-time notifications of changes
- **Sub-databases**: Namespace isolation within a single database
- **Compare-and-Swap**: Conditional updates for consistency
- **Sparse Downloads**: Only download needed parts when replicating
- **History Tracking**: Complete audit trail of all operations
- **Flexible Encoding**: Support for different key/value encodings