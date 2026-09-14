import { Component, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import type { Group } from 'three';

const destinations = [
  { label: 'Projects', path: '/projects', position: [-1.2, .6, 1.3] as [number,number,number], color: '#56d364' },
  { label: 'Experience', path: '/experience', position: [1.2, .8, 1.1] as [number,number,number], color: '#58a6ff' },
  { label: 'Contact', path: '/contact', position: [.2, -1.2, 1.4] as [number,number,number], color: '#ffa657' },
];

class SceneBoundary extends Component<{children:ReactNode}, {failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? <p className="p-4">Use the links below to explore.</p> : this.props.children; }
}

function Network({ rotation, paused, onHover, moved }: {
  rotation: React.MutableRefObject<{x:number;y:number}>; paused:boolean;
  onHover:(label:string)=>void; moved:React.MutableRefObject<boolean>;
}) {
  const group = useRef<Group>(null);
  useFrame((_,delta) => {
    if (!group.current) return;
    if (!paused) rotation.current.y += Math.min(delta,.05)*.12;
    group.current.rotation.set(rotation.current.x,rotation.current.y,0);
  });
  return <group ref={group}>
    <mesh><icosahedronGeometry args={[1.85,2]} /><meshBasicMaterial color="#58a6ff" wireframe transparent opacity={.23} /></mesh>
    <mesh><sphereGeometry args={[1.79,24,16]} /><meshBasicMaterial color="#0a0e14" /></mesh>
    {destinations.map(node => <mesh key={node.path} position={node.position}
      onPointerOver={e=>{e.stopPropagation();onHover(node.label);}}
      onPointerOut={()=>onHover('')}
      onClick={e=>{e.stopPropagation();if(!moved.current) window.location.assign(node.path);}}>
      <sphereGeometry args={[.2,16,16]} /><meshBasicMaterial color={node.color} />
    </mesh>)}
  </group>;
}

export default function HeroScene() {
  const reduced = useReducedMotion();
  const [paused,setPaused] = useState(false);
  const [dragging,setDragging] = useState(false);
  const [hover,setHover] = useState('');
  const rotation = useRef({x:0,y:0});
  const moved = useRef(false);
  const origin = useRef<{x:number;y:number;rx:number;ry:number}|null>(null);
  return <div className="network-widget win">
    <div className="win__bar"><span className="win__title">~/network — explore</span>
      <button className="btn-term btn-term--sm" onClick={()=>setPaused(!paused)} disabled={!!reduced} aria-pressed={paused || !!reduced}>{paused || reduced ? 'Paused' : 'Pause'}</button>
      <button className="btn-term btn-term--sm" onClick={()=>{rotation.current={x:0,y:0};}}>Reset</button>
    </div>
    <div className="network-viewport" aria-label="Interactive network globe. Drag to rotate, or use the page links below."
      onPointerDown={e=>{if(e.button!==0)return;origin.current={x:e.clientX,y:e.clientY,rx:rotation.current.x,ry:rotation.current.y};moved.current=false;setDragging(true);(e.target as HTMLElement).setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{const start=origin.current;if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>6)moved.current=true;rotation.current={x:Math.max(-1.2,Math.min(1.2,start.rx+dy*.008)),y:start.ry+dx*.008};}}
      onPointerUp={()=>{origin.current=null;setDragging(false);}}
      onPointerCancel={()=>{origin.current=null;setDragging(false);}}
      onLostPointerCapture={()=>{origin.current=null;setDragging(false);}}>
      <SceneBoundary><Canvas camera={{position:[0,0,5.6],fov:48}} dpr={[1,1.5]} gl={{alpha:true,antialias:true,powerPreference:'low-power'}}>
        <Network rotation={rotation} paused={paused || !!reduced || dragging || !!hover} onHover={setHover} moved={moved} />
      </Canvas></SceneBoundary>
    </div>
    <p className="mono t-dim px-3" style={{fontSize:'.75rem'}}>{hover ? `Open ${hover}` : 'Drag to rotate · select a coloured node'}</p>
    <div className="d-flex flex-wrap gap-2 p-3 pt-0">{destinations.map(node=><a className="btn-term btn-term--sm" key={node.path} href={node.path}><span style={{color:node.color}}>●</span> {node.label}</a>)}</div>
  </div>;
}
