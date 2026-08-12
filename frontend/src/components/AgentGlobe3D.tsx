"use client";

import { Canvas } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";

export default function AgentGlobe3D({ allDone }: { allDone: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <ambientLight intensity={allDone ? 0.4 : 0.8} />
      <directionalLight position={[10, 10, 5]} intensity={allDone ? 1 : 2} color="#BAF91A" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#4DFFD2" />
      <pointLight position={[0, 0, 0]} intensity={2} color="#BAF91A" />
      
      {/* 
        MeshDistortMaterial provides the physical amoeba motion.
        - distort: amount of geometric distortion
        - speed: speed of the distortion
      */}
      <Sphere args={[1, 64, 64]} scale={allDone ? 0.9 : 1.2}>
        <MeshDistortMaterial
          color={allDone ? "#4ADE80" : "#BAF91A"}
          emissive={allDone ? "#1A4D2E" : "#4A7A0A"}
          emissiveIntensity={0.5}
          metalness={0.1}
          roughness={0.2}
          distort={allDone ? 0.2 : 0.6}
          speed={allDone ? 1 : 4}
        />
      </Sphere>
    </Canvas>
  );
}
