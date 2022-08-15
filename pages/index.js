import { useEffect, useState } from "react";
import { CircularIndeterminate } from '../components/progress'
import {getSupportedPlatform, isSupportedPlatform, isPwa} from '../lib/support'
import BasicLayout from '../layouts/basic'
import Trust from '../components/trust'

// let timeout = null;
let _reloading = false;

async function reload(){
  // alert('reload fn')
  if (isPwa() && document.visibilityState === 'visible'){
    // alert('wait for active worker')
    while (navigator.serviceWorker?.controller?.state !== "activated")
      await new Promise((r) => setTimeout(r, 100));
    // alert('reload')
    if (!_reloading){
      _reloading = true;
      window.location.href = `/timeline/fediverse`
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

// async function alertLoop(){
//   setInterval(() => {
//     alert('interval loop?')
//   }, 5000)
// }

registerReloader().catch(e => {
  alert(e.message)
})

// alertLoop()

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

  if (recommended){
    return <Unsupported recommended={recommended}/>   
  }

  if (platform) {
    return <Instructions platform={platform}/>
  }

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