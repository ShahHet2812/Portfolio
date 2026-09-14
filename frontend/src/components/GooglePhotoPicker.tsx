import { useRef, useState } from 'react';
type Props={clientId:string;onPhoto:(file:File)=>Promise<void>;onError:(message:string)=>void};
export default function GooglePhotoPicker({clientId,onPhoto,onError}:Props){
  const token=useRef(''),session=useRef('');const [uri,setUri]=useState(''),[busy,setBusy]=useState(false);
  async function call(action:string){const response=await fetch('/api/admin/import/picker',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Action':'1'},body:JSON.stringify({action,token:token.current,sessionId:session.current})});const data=await response.json();if(!response.ok)throw Error(data.error);return data;}
  async function connect(){
    setBusy(true);try{
      if(!(window as any).google?.accounts?.oauth2)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.onload=()=>resolve();script.onerror=()=>reject(Error('Could not load Google sign-in.'));document.head.appendChild(script);});
      (window as any).google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',callback:async(result:any)=>{
        try{if(!result.access_token)throw Error('Google sign-in was not completed.');token.current=result.access_token;const selected=await call('create');session.current=selected.id;setUri(selected.pickerUri);}catch(e){onError((e as Error).message);}finally{setBusy(false);}
      },error_callback:()=>{setBusy(false);onError('Google sign-in was cancelled.');}}).requestAccessToken();
    }catch(e){onError((e as Error).message);setBusy(false);}
  }
  async function importSelected(){setBusy(true);try{
    const status=await call('status');if(!status.mediaItemsSet)throw Error('Finish selecting one photo in Google Photos first.');
    const result=await call('list');const photo=result.mediaItems?.[0];if(!photo||photo.type!=='PHOTO')throw Error('Select a still photo, not a video.');
    const response=await fetch('/api/admin/import/picker',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Action':'1'},body:JSON.stringify({action:'download',token:token.current,baseUrl:photo.mediaFile.baseUrl})});
    if(!response.ok)throw Error((await response.json()).error);const blob=await response.blob();await onPhoto(new File([blob],'google-photo.jpg',{type:blob.type}));await call('delete');token.current='';session.current='';setUri('');
  }catch(e){onError((e as Error).message);}finally{setBusy(false);}}
  if(!clientId)return <p>Direct Google Photos selection needs a Google OAuth client ID. You can still download a photo and upload it above.</p>;
  return <div className="admin-actions"><button disabled={busy} onClick={connect}>Connect Google Photos</button>{uri&&<><a href={uri} target="_blank" rel="noreferrer">Choose one photo in Google Photos ↗</a><button disabled={busy} onClick={importSelected}>Import selected photo</button></>}</div>;
}
