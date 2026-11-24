let access = '', refresh = '';
export function setSession(data: {access: string; refresh: string}) {access=data.access;refresh=data.refresh;}
export function clearSession(){access='';refresh='';}
export async function api(path:string, init:RequestInit={}, retry=true):Promise<any>{
 const headers=new Headers(init.headers);if(access)headers.set('Authorization',`Bearer ${access}`);if(init.body && !(init.body instanceof FormData))headers.set('Content-Type','application/json');
 const response=await fetch(`/api/${path}`,{...init,headers});
 if(response.status===401 && refresh && retry){const r=await fetch('/api/auth/refresh/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh})});if(r.ok){setSession(await r.json());return api(path,init,false);}clearSession();throw Error('Tu sesión venció. Vuelve a iniciar sesión.');}
 if(!response.ok){const data=await response.json().catch(()=>({detail:'El servidor no está disponible.'}));throw Error(typeof data.detail==='string'?data.detail:Object.entries(data).map(([k,v])=>`${k}: ${v}`).join(' · '));}
 return response.status===204?null:response.json();
}
export async function logout(){try{await api('auth/logout/',{method:'POST',body:JSON.stringify({refresh})});}finally{clearSession();}}
