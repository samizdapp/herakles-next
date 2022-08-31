import Client from "herakles-lib/dist/pocket_client";
// import Client from 'https'
import localforage from "localforage";

self.setImmediate = (fn) => setTimeout(fn, 0);

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
// self.__WB_DISABLE_DEV_LOGS = true

// const _fetch = self.fetch

// Listen to fetch events
self.addEventListener("fetch", function (event) {
  console.log("event", event);
  if (event?.request.method !== "GET") {
    // default service worker only handles GET
    event?.respondWith(fetch(event.request));
  }
  //   if (/\.jpg$|.png$/.test(event.request.url)) {                             1

  //     var supportsWebp = false;
  //     if (event.request.headers.has('accept')) {                              2
  //       supportsWebp = event.request.headers
  //         .get('accept')
  //         .includes('webp');
  //     }

  //     if (supportsWebp) {                                                     3
  //        var req = event.request.clone();

  //       var returnUrl = req.url.substr(0, req.url.lastIndexOf(".")) + ".webp";4

  //       event.respondWith(
  //         fetch(returnUrl, {
  //           mode: 'no-cors'
  //         })
  //       );
  //     }
  //   }
});

// const broadcast = new BroadcastChannel('address-channel');

// async function getAddress(request: any): Promise<string> {
//     const { hostname } = new URL(request.url)
//     const bootstrap = hostname.endsWith('localhost') ? ['192.168.42.1', '127.0.0.1'] : [hostname]
//     let addresses: Array<string> = (await localforage.getItem('addresses')) || bootstrap

//     // do {
//     broadcast.postMessage({
//         type: 'TRY_ADDRESSES',
//         nonce: Date.now(),
//         addresses
//     })
//     const returned: AddressesResponse = await Promise.race(addresses.map((addr, i) => {

//         return _fetch(`http://${addr}/api/addresses`, { referrerPolicy: "unsafe-url" }).then(r => {
//             broadcast.postMessage({
//                 type: 'TRIED_ADDRESS',
//                 nonce: Date.now(),
//                 addr
//             });
//             if (!r.ok) throw new Error()
//             return r.json()
//         }).then(json => {
//             return ({
//                 ...json,
//                 index: i
//             })
//         }).catch((e) => {
//             broadcast.postMessage({
//                 type: 'TRIED_ADDRESS_ERROR',
//                 nonce: Date.now(),
//                 addr,
//                 error: e.toString()
//             });
//             return new Promise(r => setTimeout(r, 1000))
//         })
//     }))
//     if (!returned) {
//         return getAddress(request)
//     }
//     const preferred = addresses[returned?.index || 0]
//     broadcast.postMessage({
//         type: 'PREFERRED_ADDRESS',
//         nonce: Date.now(),
//         addresses,
//         preferred
//     });
//     // console.log('got addresses, good index:', returned.index)
//     addresses = returned?.addresses ? bootstrap.concat(returned.addresses).map(s => s.trim()) : addresses
//     await localforage.setItem('addresses', addresses)
//     return preferred === 'localhost' ? '127.0.0.1' : preferred
//     // } while (true)
// }

// function shouldHandle(request: any) {
//     console.log('shouldHandle?', request)
//     const { hostname } = new URL(request.url)

//     return hostname.endsWith(self.location.hostname) && request.url !== `http://${self.location.hostname}/`
// }

// async function maybeRedirectFetch(request: any, options: object) {
//     console.log('check shouldHandle')
//     if (!shouldHandle(request)) {
//         return _fetch(request, options)
//     }
//     const address = await getAddress(request)
//     const { hostname, pathname, searchParams } = new URL(request.url)
//     const _headers = request.headers
//     const mode = request.mode
//     const method = request.method
//     const keepalive = request.keepalive
//     const redirect = request.redirect
//     const referrer = request.referrer
//     const referrerPolicy = request.referrerPolicy
//     const body = ['GET', 'HEAD'].includes(method) ? undefined : await request.blob()

//     const headerMap = new Map()
//     const [subdomain] = hostname.split('.')

//     headerMap.set("X-Intercepted-Subdomain", subdomain)

//     for (const [key, value] of _headers) {
//         headerMap.set(key, value)
//     }

//     const headers = Object.fromEntries(headerMap)

//     const args = {
//         headers,
//         mode: mode === 'navigate' ? undefined : mode,
//         method,
//         keepalive,
//         redirect,
//         referrer,
//         referrerPolicy,
//         body,
//         ...options
//     }

//     const url = `http://${address}${pathname}${searchParams ? `?${searchParams}` : ''}`

//     return _fetch(url, args)
// }

// console.log('reasigning fetch')
// // self.fetch = maybeRedirectFetch
self.addEventListener('message', async function (evt) {
  console.log('postMessage received', evt);
  if (evt.data.type === 'MDNS'){
    const address = evt.data.address
    localforage.setItem('mdns', { address })
  }

  localforage.setItem('started', {started: true})
  self.client.patchFetchWorker()
});

self.addEventListener('install', (event) => {
  // The promise that skipWaiting() returns can be safely ignored.
  console.log('got install')
  self.skipWaiting();

  // Perform any other actions required for your
  // service worker to install, potentially inside
  // of event.waitUntil();
});

self.addEventListener('activate', (event) => {
  console.log('got activate')
  self.clients.claim()
})

const WELCOME_STATUS = `http://pleroma.3b836fd1ff44e0fca4768822415ef6614d0c0d4f07b96008b1367734161e628.f.yg/api/v1/statuses/AMZQ43yUFFVkzIKKO0`
const WELCOME_STATUS_PAGE = `/@ryan@pleroma.3b836fd1ff44e0fca4768822415ef6614d0c0d4f07b96008b1367734161e628.f.yg/posts/AMZQ43yUFFVkzIKKO0'`

async function main() {
  console.log("starting worker init");


  const client = new Client(
    { host: self.location.hostname, port: 4000 },
    ({ lan, wan }) => {
      console.log("worker got", lan, wan);
      localforage.setItem("addresses", { lan, wan });
    }
  );

  const obj = await localforage.getItem("addresses");
  if (obj) {
    obj.lan = obj.lan.trim();
    obj.wan = obj.wan.trim();
    console.log("got stored addresses", obj);
    client.handleAddresses(obj);
  }

  await client.init();
  client.subdomain = "pleroma";
  if (await localforage.getItem('started')){
    client.patchFetchWorker();
  }
  self.client = client;
  console.log("patched fetch");
  const soapstore = localforage.createInstance({
    name: "soapbox"
  });
  self.soapstore = soapstore

  while (!(await localforage.getItem('welcome'))){
    const key = (await soapstore.keys()).filter((k) => {
      return k.startsWith('authAccount')
    })[0]
    const client = (await self.clients.matchAll()).filter(({url}) => {
      const u = new URL(url)
      return u.pathname === '/'
    })[0]

    if (key && client && (await fetch(WELCOME_STATUS).catch(e => ({ok : false}))).ok){
      await localforage.setItem('welcome', 'true')

      client.navigate(WELCOME_STATUS_PAGE)  
    }

    await new Promise(r => setTimeout(r, 100))
  }
}

main().catch((e) => {
  console.log("custom error", e);
});
