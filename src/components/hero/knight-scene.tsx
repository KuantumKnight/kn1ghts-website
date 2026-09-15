"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

const fragments = [
  [-2.2,1.5,-.2,.07],[-1.4,.7,.5,.035],[-.8,1.8,.2,.04],[.1,1.4,.1,.025],
  [1.4,1.7,.5,.045],[2.1,.8,0,.035],[-2.4,-.2,.4,.04],[-1.6,-1,.1,.025],
  [-.5,-.6,.4,.05],[.5,-1.2,.2,.03],[1.6,-.5,.5,.04],[2.3,-1.3,0,.03],
] as const;

function Atmosphere(){
  const group=useRef<Group>(null);
  useFrame(({pointer},delta)=>{if(!group.current)return;group.current.rotation.y+=(pointer.x*.08-group.current.rotation.y)*delta;group.current.rotation.x+=(-pointer.y*.04-group.current.rotation.x)*delta;});
  return <group ref={group}>{fragments.map(([x,y,z,size],index)=><Float key={index} speed={.35+index*.025} floatIntensity={.28} rotationIntensity={.5}><mesh position={[x,y,z]} rotation={[index*.4,index*.7,index*.2]}><octahedronGeometry args={[size,0]}/><meshStandardMaterial color={index%4===0?"#7f1018":"#b9b1a4"} metalness={.7} roughness={.55}/></mesh></Float>)}</group>;
}

export function KnightScene(){return <Canvas dpr={[1,1.5]} camera={{position:[0,0,5],fov:42}} gl={{antialias:true,alpha:true,powerPreference:"high-performance"}}><ambientLight intensity={.7}/><pointLight position={[2,3,4]} intensity={5} color="#d8d0c3"/><Atmosphere/></Canvas>;}
