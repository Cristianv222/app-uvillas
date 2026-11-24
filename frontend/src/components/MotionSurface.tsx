import {Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode} from 'react';
import gsap from 'gsap';
const Arc=lazy(()=>import('./Arc'));
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?null:this.props.children;}}
export function MotionSurface({children}:{children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);const [enabled,setEnabled]=useState(false);
 useEffect(()=>{const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{setEnabled(true);const ctx=gsap.context(()=>{gsap.fromTo('.page-content',{opacity:0,y:16},{opacity:1,y:0,duration:.7,ease:'power2.out',clearProps:'all'});},root);return()=>{ctx.revert();setEnabled(false);};});return()=>mm.revert();},[]);
 return <div ref={root} className="motion-surface">{enabled&&<div className="system-atmosphere" aria-hidden="true"><Boundary><Suspense fallback={null}><Arc/></Suspense></Boundary></div>}<div className="page-content">{children}</div></div>;
}
