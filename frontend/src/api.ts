import { currentServer, isNativeApp } from './lib/server';
let access = '', refresh = '';
export function setSession(data: {access: string; refresh: string}) {access=data.access;refresh=data.refresh;}
export function clearSession(){access='';refresh='';}
export async function api(path:string, init:RequestInit={}, retry=true):Promise<any>{
 const headers=new Headers(init.headers);if(access)headers.set('Authorization',`Bearer ${access}`);if(init.body && !(init.body instanceof FormData))headers.set('Content-Type','application/json');
 if(isNativeApp() && !currentServer()) throw Error('Configura primero la dirección del servidor.');
 const base=currentServer();
 const response=await fetch(`${base}/api/${path}`,{...init,headers}).catch(()=>{throw Error(isNativeApp()?`No se pudo conectar con ${base}. Revisa que el teléfono y la PC estén en el mismo Wi-Fi y que Docker esté encendido.`:'El servidor no está disponible.');});
 if(response.status===401 && refresh && retry){const r=await fetch(`${currentServer()}/api/auth/refresh/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh})});if(r.ok){setSession(await r.json());return api(path,init,false);}clearSession();throw Error('Tu sesión venció. Vuelve a iniciar sesión.');}
 if(!response.ok){const data=await response.json().catch(()=>({detail:'El servidor no está disponible.'}));throw Error(typeof data.detail==='string'?data.detail:Object.entries(data).map(([k,v])=>`${k}: ${v}`).join(' · '));}
 return response.status===204?null:response.json();
}
export async function logout(){try{await api('auth/logout/',{method:'POST',body:JSON.stringify({refresh})});}finally{clearSession();}}
