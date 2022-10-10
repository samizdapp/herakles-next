import { createLibp2p } from 'libp2p'
import { WebSockets } from '@libp2p/websockets'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { all as filter } from '@libp2p/websockets/filters'
import localforage from 'localforage'
import { LevelDatastore } from 'datastore-level'
import { dnsaddrResolver } from '@multiformats/multiaddr/resolvers'
import { Bootstrap } from '@libp2p/bootstrap'
import { encode, decode } from "lob-enc";
import { Buffer } from 'buffer/'
import { pipe } from 'it-pipe'
import Multiaddr from 'multiaddr'

self.DIAL_TIMEOUT = 20000

self.Multiaddr = Multiaddr

const CHUNK_SIZE = 1024 * 8;
self.Buffer = Buffer;

self._fetch = fetch;

async function normalizeBody(body) {
  try {
    if (!body) return undefined;
    if (typeof body === "string") return Buffer.from(body);
    if (Buffer.isBuffer(body)) return body;
    if (body instanceof ArrayBuffer) {
      if (body.byteLength > 0) return Buffer.from(new Uint8Array(body));
      return undefined;
    }
    if (body.arrayBuffer) {
      return Buffer.from(new Uint8Array(await body.arrayBuffer()));
    }
    if (body.toString() === "[object ReadableStream]") {
      const reader = body.getReader();
      const chunks = [];
      let _done = false;
      do {
        const { done, value } = await reader.read();
        _done = done;
        chunks.push(Buffer.from(new Uint8Array(value)));
      } while (!_done);
      return Buffer.concat(chunks);
    }

    throw new Error(`don't know how to handle body`);
  } catch (e) {
    return Buffer.from(
      `${e.message} ${typeof body} ${body.toString()} ${JSON.stringify(body)}`
    );
  }
}

async function getStream(protocol = '/samizdapp-proxy') {
  let streamOrNull = null;
  do {
    streamOrNull = await Promise.race([
      self.node.dialProtocol(self.serverPeer, protocol).catch(e => {
        console.log('dialProtocol error, retry', e)
        return null;
      }),
      new Promise(r => setTimeout(r, self.DIAL_TIMEOUT))
    ])
    if (!streamOrNull) {
      await self.node.stop()
      await self.node.start()
      const relays = await localforage.getItem('libp2p.relays').then(str_array => {
        return str_array.map(Multiaddr.multiaddr)
      })
      await self.node.peerStore.addressBook.add(self.serverPeer, relays)

    }
  } while (!streamOrNull)

  return streamOrNull
}

self.getStream = getStream;

async function p2Fetch(reqObj, reqInit = {}) {
  // console.log('p2Fetch', reqObj)
  const patched = patchFetchArgs(reqObj, reqInit);
  const body = reqObj.body ? reqObj.body
    : reqInit.body ? reqInit.body
      : reqObj.arrayBuffer ? (await reqObj.arrayBuffer())
        : null;

  reqObj = patched.reqObj;
  reqInit = patched.reqInit;
  // console.log("pocketFetch2", reqObj, reqInit, body);
  delete reqObj.body;
  delete reqInit.body;
  const pbody = await normalizeBody(body);
  const packet = encode({ reqObj, reqInit }, pbody);
  // console.log('packet:', packet.toString('hex'))

  // console.log('packet?', packet)
  const stream = await getStream()

  let i = 0;
  const parts = []
  for (; i <= Math.floor(packet.length / CHUNK_SIZE); i++) {
    parts.push(
      packet.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    );
  }

  parts.push(Buffer.from([0x00]))
  // console.log('parts:')
  // parts.forEach(p => console.log(p.toString('hex')))

  return new Promise((resolve, reject) => {
    let done = false
    try {
      pipe(
        parts,
        stream,
        async function (source) {
          const parts = []
          for await (const msg of source) {
            const buf = Buffer.from(msg.subarray())
            if (msg.subarray().length === 1 && buf[0] === 0x00) {
              const resp = decode(Buffer.concat(parts));
              if (!resp.json.res) {
                return reject(resp.json.error)
              }
              resp.json.res.headers = new Headers(resp.json.res.headers);
              // alert("complete");
              done = true;
              resolve(new Response(resp.body, resp.json.res));
              stream.close()
            } else {
              parts.push(buf)
            }
          }
        }
      )
    } catch (e) {
      console.warn(e)
      if (!done) {
        p2Fetch(reqObj, reqInit).then(resolve).catch(reject)
      }
    }

  })
}

const getHost = () => {
  try {
    return window.location.host
  } catch (e) {
    return self.location.host
  }
}

function patchFetchArgs(_reqObj, _reqInit = {}) {
  // if (typeof _reqObj === "string" && _reqObj.startsWith("http")) {
  // console.log("patch");
  const url = new URL(_reqObj.url.startsWith('http') ? _reqObj.url : `http://localhost${_reqObj.url}`);
  _reqInit.headers = _reqObj.headers || {};
  if (url.pathname !== '/manifest.json') {
    _reqInit.headers["X-Intercepted-Subdomain"] = 'pleroma';
  }

  for (var pair of _reqObj.headers.entries()) {
    _reqInit.headers[pair[0]] = pair[1];
    // console.log(pair[0] + ": " + pair[1]);
  }

  if (url.host === getHost()) {
    // console.log("subdomain", _reqInit);
    url.host = "localhost";
    url.protocol = "http:";
    url.port = "80";
  }

  // }

  const reqObj = {
    bodyUsed: _reqObj.bodyUsed,
    cache: _reqObj.cache,
    credentials: _reqObj.credentials,
    destination: _reqObj.destination,
    headers: _reqObj.headers,
    integrity: _reqObj.integrity,
    isHistoryNavigation: _reqObj.isHistoryNavigation,
    keepalive: _reqObj.keepalive,
    method: _reqObj.method,
    mode: _reqObj.mode,
    redirect: _reqObj.redirect,
    referrer: _reqObj.referrer,
    referrerPolicy: _reqObj.referrerPolicy,
    url: url.toString(),
  };

  const reqInit = _reqInit;

  return { reqObj, reqInit };
}

async function openRelayStream() {
  while (true) {
    const stream = await getStream('/samizdapp-relay').catch(e => {
      console.error('error getting stream', e)
    })
    if (!stream) {
      return;
    }
    console.log('got relay stream')
    await pipe(
      stream.source,
      async function (source) {
        for await (const msg of source) {
          const str_relay = Buffer.from(msg.subarray()).toString()
          const multiaddr = Multiaddr.multiaddr(str_relay)
          console.log('got relay multiaddr', multiaddr.toString())
          await localforage.getItem('libp2p.relays').then((str_array) => {
            return localforage.setItem('libp2p.relays', [str_relay, ...(str_array || [])])
          })
          await self.node.peerStore.addressBook.add(self.serverPeer, [multiaddr]).catch(e => {
            console.warn('error adding multiaddr', multiaddr.toString())
            console.error(e)
          })
        }
      }
    ).catch(e => {
      console.log('error in pipe', e)
    })
  }
}

async function main() {
  return new Promise(async (RESOLVE, REJECT) => {
    try {

      const bootstrapaddr = await localforage.getItem('libp2p.bootstrap') || await fetch('/pwa/libp2p.bootstrap').then(r => r.text()).then(async id => {
        await localforage.setItem('libp2p.bootstrap', id)
        return id
      })

      const relay_addrs = (await localforage.getItem('libp2p.relays').catch(_ => ([]))) || []

      const { hostname } = new URL(self.origin)
      const [_, _proto, _ip, ...rest] = bootstrapaddr.split('/')
      const hostaddr = `/dns4/${hostname}/${rest.join('/')}`
      const bootstraplist = [bootstrapaddr, hostaddr, ...relay_addrs]
      const datastore = new LevelDatastore('./libp2p')
      await datastore.open() // level database must be ready before node boot
      const serverID = bootstrapaddr.split('/').pop()

      const node = await createLibp2p({
        datastore,
        transports: [
          new WebSockets({
            filter
          })
        ],
        connectionEncryption: [
          new Noise()
        ],
        streamMuxers: [
          new Mplex()
        ],
        peerDiscovery: [
          new Bootstrap({
            list: bootstraplist // provide array of multiaddrs
          })
        ],
        connectionManager: {
          autoDial: true, // Auto connect to discovered peers (limited by ConnectionManager minConnections)
          minConnections: 0,
          maxDialsPerPeer: 10
          // The `tag` property will be searched when creating the instance of your Peer Discovery service.
          // The associated object, will be passed to the service when it is instantiated.
        },
        relay: {                   // Circuit Relay options (this config is part of libp2p core configurations)
          enabled: true,           // Allows you to dial and accept relayed connections. Does not make you a relay.
          autoRelay: {
            enabled: true,         // Allows you to bind to relays with HOP enabled for improving node dialability
            maxListeners: 5         // Configure maximum number of HOP relays to use
          }
        },
        dialer: {
          dialTimeout: self.DIAL_TIMEOUT,
          maxParallels: 25,
          maxAddrsToDial: 25,
          maxDialsPerPeer: 10
        },
        resolvers: {
          dnsaddr: dnsaddrResolver
          // ,
          // host: hostResolver
        },
        peerStore: {
          persistence: true,
          threshold: 1
        },
      })
      // Listen for new peers
      let foundServer = false;
      node.addEventListener('peer:discovery', (evt) => {
        const peer = evt.detail
        console.log(`Found peer ${peer.id.toString()}`)
        // peer.multiaddrs.forEach(ma => console.log(ma.toString()))
        // console.log(peer)
        if (peer.id.toString() === serverID && !foundServer) {
          foundServer = true;
          node.ping(peer.id)
        }
      })

      node.peerStore.addEventListener('change:multiaddrs', (evt) => {
        // Updated self multiaddrs?
        // if (evt.detail.peerId.equals(node.peerId)) {
        console.log(`updated addresses for ${evt.detail.peerId.toString()}`)
        console.log(evt.detail)
        // }
      })

      // Listen for new connections to peers
      let serverConnected = false;
      node.connectionManager.addEventListener('peer:connect', async (evt) => {
        const connection = evt.detail
        const str_id = connection.remotePeer.toString()

        console.log(`Connected to ${str_id}, check ${serverID}, serverConnected ${serverConnected}`)
        if (str_id === serverID && !serverConnected) {
          serverConnected = true;
          self.serverPeer = connection.remotePeer
          openRelayStream(node)
          RESOLVE()
        }
        // while (true) {
        //   await new Promise(r => setTimeout(r, 5000))
        //   await node.ping(connection.remotePeer).catch(async e => {
        //     await node.stop()
        //     await node.start()
        //   })
        // }

      })

      // Listen for peers disconnecting
      node.connectionManager.addEventListener('peer:disconnect', (evt) => {
        const connection = evt.detail
        console.log(`Disconnected from ${connection.remotePeer.toString()}`)
      })

      await node.start()
      self.libp2p = self.node = node;
    } catch (e) {
      REJECT(e)
    }
  })
}


self.setImmediate = (fn) => setTimeout(fn, 0);


self.addEventListener("fetch", function (event) {
  if (event?.request.method !== "GET") {
    // default service worker only handles GET
    event?.respondWith(fetch(event.request));
  }
});

self.addEventListener('online', () => console.log('<<<<online'))
self.addEventListener('offline', () => console.log('<<<<offline'))

self.addEventListener('message', async function (evt) {
  console.log('postMessage received', evt);
  if (evt.data.type === 'MDNS') {
    const address = evt.data.address
    localforage.setItem('mdns', { address })
  }

  localforage.setItem('started', { started: true })
  await navToRoot()
});

self.addEventListener('install', (event) => {
  // The promise that skipWaiting() returns can be safely ignored.
  console.log('got install')
  self.skipWaiting();

  // Perform any other actions required for your
  // service worker to install, potentially inside
  // of event.waitUntil();
});

self.addEventListener('activate', async (event) => {
  console.log('got activate')
  await self.clients.claim()
})

async function navToRoot() {
  const clienttab = (await self.clients.matchAll()).filter(({ url }) => {
    const u = new URL(url)
    return u.pathname === "/pwa"
  })[0]

  if (clienttab) {
    clienttab.navigate('/').catch(e => {
      clienttab.postMessage('NAVIGATE')
    })
  }
}

self.deferral = main().then(() => {
  console.log('patching fetch')
  self.fetch = p2Fetch.bind(self)
})

self.stashedFetch = self.fetch

self.fetch = async (...args) => {
  if (typeof args[0] === 'string') {
    return self.stashedFetch(...args)
  }
  console.log('fetch waiting for deferral', args[0])
  await self.deferral
  console.log('fetch deferred', args[0])
  return self.fetch(...args)
}

