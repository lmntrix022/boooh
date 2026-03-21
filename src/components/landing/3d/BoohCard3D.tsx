import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

/**
 * BOOH CARD 3D - THE MONOLITH
 * Carte de visite 3D qui réagit au scroll avec chorégraphie Apple-style
 */

// Logo Bööh 3D en forme de gemme
function BoohLogo3D({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Torus principal (le O) */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.35, 0.12, 48, 96]} />
        <meshPhysicalMaterial 
          color="#8b5cf6"
          roughness={0}
          metalness={0.1}
          transmission={0.9}
          thickness={1.5}
          ior={1.5}
          emissive="#8b5cf6"
          emissiveIntensity={0.6}
        />
      </mesh>
      
      {/* Point gauche (ö) */}
      <mesh position={[-0.18, 0.5, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshPhysicalMaterial 
          color="#8b5cf6"
          roughness={0}
          metalness={0.1}
          emissive="#8b5cf6"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Point droit (ö) */}
      <mesh position={[0.18, 0.5, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshPhysicalMaterial 
          color="#8b5cf6"
          roughness={0}
          metalness={0.1}
          emissive="#8b5cf6"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

export function BoohCard3D() {
  const ref = useRef<THREE.Group>(null);
  const scroll = useScroll();
  const { width } = useThree((state) => state.viewport);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const offset = scroll.offset;
    
    // CHORÉGRAPHIE OPTIMISÉE POUR LE STORYTELLING
    let targetPos: [number, number, number] = [0, 0, 0];
    let targetRot: [number, number, number] = [0, 0, 0];

    // 1. Hero (0-10%) - Center, Proud
    if (offset < 0.1) { 
      targetPos = [0, -0.2, 0];
      targetRot = [0.1, 0.2, 0];
    } 
    // 2. Truth (10-20%) - Disappear into shadow
    else if (offset < 0.2) { 
      targetPos = [0, -8, -5]; 
      targetRot = [0.5, 0, 0];
    }
    // 3. Revelation (20-30%) - Spin back in
    else if (offset < 0.3) {
      targetPos = [0, 0, 1.5]; 
      targetRot = [0, Math.PI * 2 * ((offset - 0.2) * 10), 0.1]; 
    }
    // 4. POV (30-40%) - Side Profile (Sleekness)
    else if (offset < 0.4) {
      targetPos = [width / 3, 0, 0.5];
      targetRot = [0, -0.6, 0.1];
    }
    // 5. Product Story (40-70%) - Dynamic Floating
    else if (offset < 0.7) {
      const phase = (offset - 0.4) * 10;
      targetPos = [Math.sin(phase) * 0.5, 0, 0];
      targetRot = [0.2, phase * 0.2, 0];
    }
    // 6. System (70-80%) - Zoom out, part of grid
    else if (offset < 0.8) {
      targetPos = [0, 1.5, -3];
      targetRot = [0.4, 0, 0];
    }
    // 7. Footer (80-100%) - Spinning Icon
    else {
      targetPos = [0, 0, 0];
      targetRot = [0, offset * Math.PI * 4, 0];
    }

    // DAMPING pour sensation lourde et premium (Apple-style)
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, targetPos[0], 3, delta);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, targetPos[1], 3, delta);
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, targetPos[2], 3, delta);
    
    ref.current.rotation.x = THREE.MathUtils.damp(
      ref.current.rotation.x, 
      targetRot[0] + state.pointer.y * 0.05, 
      3, 
      delta
    );
    ref.current.rotation.y = THREE.MathUtils.damp(
      ref.current.rotation.y, 
      targetRot[1] + state.pointer.x * 0.05, 
      3, 
      delta
    );
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, targetRot[2], 3, delta);
  });

  return (
    <group ref={ref}>
      {/* Le Corps de la Carte */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.37, 2.125, 0.03]} />
        <meshStandardMaterial 
          color="#080808"
          roughness={0.4}
          metalness={0.8}
          envMapIntensity={2}
        />
      </mesh>

      {/* Logo intégré */}
      <BoohLogo3D position={[0, 0.15, 0.02]} scale={0.75} />

      {/* Texte minimaliste "BÖÖH" */}
      <group position={[0, -0.5, 0.016]}>
        <mesh>
          <planeGeometry args={[0.8, 0.1]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      </group>

      {/* Chip doré (NFC) */}
      <group position={[-1.2, -0.2, 0.016]}>
        <mesh>
          <boxGeometry args={[0.5, 0.4, 0.005]} />
          <meshStandardMaterial 
            color="#D4AF37"
            metalness={1}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}

export default BoohCard3D;

