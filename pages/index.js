import { useEffect, useState } from "react";
import { CircularIndeterminate } from '../components/progress'
import {getSupportedPlatform, isSupportedPlatform, isPwa} from '../lib/support'
import BasicLayout from '../layouts/basic'
import Trust from '../components/trust'

const WELCOME_STATUS = `https://pleroma.507fd8ace43f877eb8e4f613d0b34e25ab213c356bb1bdd3422970ae2694e47.2.yg/api/v1/statuses/AMZ2VxYnjpo5sK8W00`
const WELCOME_STATUS_PAGE = `/@ryan@pleroma.507fd8ace43f877eb8e4f613d0b34e25ab213c356bb1bdd3422970ae2694e47.2.yg/posts/AMZ2VxYnjpo5sK8W00`


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
    await new Promise(r => setTimeout(r, 2000))
  } 
}

async function getLoadUrl(){
  const welcome = await localStorage.getItem('welcome')

  if (!welcome) {
    await waitForWelcomeAvailable()
    await localStorage.setItem('welcome', 'true')
  }

  return '/'
}

async function reload(){
  // alert('reload fn')
  if (isPwa() && document.visibilityState === 'visible'){
    // alert('wait for active worker')
    while (navigator.serviceWorker?.controller?.state !== "activated")
      await new Promise((r) => setTimeout(r, 100));
    // alert('reload')
    if (!_reloading){
      _reloading = true;
      window.location.href = await getLoadUrl()
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