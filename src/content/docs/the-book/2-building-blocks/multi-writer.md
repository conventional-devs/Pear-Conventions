---
title: Multi-Writer
---

Autobase; HyperBee, HyperDB etc.

Explain how Hyperdispatch can make this cleaner and safer

# Autobase

## Re-creating a deleted Autobase

> [!warning] Don't re-use keys

If you were to delete your local storage of a Pear app using [[#Autobase]]; but still had the keys for that [[#Autobase]] available - **you should not re-use these** to re-join the [[#Autobase]].

The way to handle the case where an [[#Autobase]] writer loses its storage is:
- The remaining writers remove the lost writer
- The remaining writers add a new writer (with a new private key)
- The new writer can now once again write to the [[#Autobase]]

