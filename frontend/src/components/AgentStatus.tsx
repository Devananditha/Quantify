"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";

function AnimatedLiquidOrb() {
  const meshRef = useRef<any>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
      <MeshDistortMaterial
        color="#cffafe"
        metalness={0.9}
        roughness={0.1}
        distort={0.4}
        speed={2.5}
      />
    </Sphere>
  );
}

export function AgentStatus() {
  return (
    <div className="relative overflow-hidden rounded-2xl mx-4 mt-auto h-[160px] p-4 flex flex-col justify-between shadow-lg border border-white/40 group cursor-pointer transition-transform hover:-translate-y-1 bg-gradient-to-br from-[#cffafe]/50 to-[#a5f3fc]/50 backdrop-blur-md">
      
      {/* 3D WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.8} color="#ffffff" />
          <directionalLight position={[5, 5, 5]} intensity={2} color="#a5f3fc" />
          <directionalLight position={[-5, -5, 2]} intensity={1} color="#0ea5e9" />
          <pointLight position={[0, 0, 5]} intensity={1} color="#ffffff" />
          <AnimatedLiquidOrb />
        </Canvas>
      </div>

      <div className="relative z-10 flex items-center justify-between pointer-events-none">
        <span className="flex items-center gap-2 text-[#08172c] text-xs font-bold tracking-widest uppercase drop-shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#08172c] animate-pulse shadow-[0_0_8px_rgba(8,23,44,0.5)]"></span>
          AI AGENTS
        </span>
        <button className="text-[#08172c] hover:bg-white/30 backdrop-blur-sm rounded p-1 transition-colors pointer-events-auto">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
