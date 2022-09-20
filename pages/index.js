import { useEffect, useState } from "react";
import { CircularIndeterminate } from '../components/progress'
import {getSupportedPlatform, isSupportedPlatform, isPwa} from '../lib/support'
import BasicLayout from '../layouts/basic'
import Trust from '../components/trust'
import localforage from "localforage";

const WELCOME_STATUS = `http://pleroma.4a4587d4f25abf54677b07d6f46c269ed8a7b50052e67b20a0f70c9f2328543.1.yg/api/v1/statuses/ANECIUz9GTWPKi7c4e`
const WELCOME_STATUS_PAGE = '/@Ry@pleroma.4a4587d4f25abf54677b07d6f46c269ed8a7b50052e67b20a0f70c9f2328543.1.yg/posts/ANECIUz9GTWPKi7c4e'

// let timeout = null;
let _reloading = false;

async function waitForWelcomeAvailable(){
  while (true) {
    const res = await fetch(WELCOME_STATUS).catch(e => {
      console.warn(e)
      return null;
    })
    if (res && res.ok){
      return;
    }
    await new Promise(r => setTimeout(r, 1000))
  } 
}

async function getLoadUrl(){
  const welcome = await localforage.getItem('welcome')
  if (welcome) {
    return '/'
  }

  await waitForWelcomeAvailable()
  
  await localforage.setItem('welcome','true')
  return WELCOME_STATUS_PAGE
}

async function reload(){
  // alert('reload fn')
  if (document.visibilityState === 'visible'){
    // alert('wait for active worker')
    while (navigator.serviceWorker?.controller?.state !== "activated")
      await new Promise((r) => setTimeout(r, 100));
    // alert('reload')
    if (!_reloading){
      _reloading = true;
      window.location.href = "/"
    }
  }
}

async function registerReloader(){
  if (typeof window === 'undefined') return;
  // alert('add visibility listener')
  document.addEventListener('visibilitychange', reload)
  // alert('try reload')
  return reload()
}


registerReloader().catch(e => {
  alert(e.message)
})


export default function Home() {
  const [platform, setPlatform] = useState('')
  const [recommended, setRecommended] = useState('')
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(null)
  const [sanity, setSanity] = useState('insane2')

  useEffect(() => {
    setSanity('insane in the membrane')
    if (isPwa()){
      setReloading(true)
      reload()
    } else if (isSupportedPlatform()){
      setPlatform(getSupportedPlatform())
    } else {
      setRecommended(getSupportedPlatform())
    }
  }, [reloading]);

  useEffect(() => {
    (async function(){
      console.log('wait for controller')
      while (navigator.serviceWorker?.controller?.state !== "activated"){
        console.log('wait', navigator.serviceWorker?.controller)
        await new Promise((r) => setTimeout(r, 1000));
  }
      const url = new URL(location.href)
      console.log('url')
      const address = url.searchParams.get('mdns')
      if (address){
        console.log('postmessage')
        navigator.serviceWorker.controller.postMessage({
          type: 'MDNS',
          address
        });
      } else {
        navigator.serviceWorker.controller.postMessage({
          type: 'START'
        })
      }
    })()
  }, [])

  if (recommended){
    return <Unsupported recommended={recommended}/>   
  }

  // if (platform) {
  //   return <Instructions platform={platform}/>
  // }

  return (
    <BasicLayout>
      {`${sanity} reloading ${reloading}: ${error ? error.message : 'no error'}`}
      <CircularIndeterminate/>
    </BasicLayout>
  );
}

function Unsupported({recommended}){
  return (
    <BasicLayout>
      <h1>Please open this page in {recommended}</h1>
    </BasicLayout>
  )
}

function Instructions({platform}){
  if (platform === 'Chrome'){
    return (
      <BasicLayout><Trust/></BasicLayout>
    )
  } else if (platform === 'Safari'){
    return (
      <SafariInstall/>
    )
  }
}

function SafariInstall(){
  <BasicLayout>add to home screen</BasicLayout>
}