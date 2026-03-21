import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Mini3DOmlaut: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const meshRef = useRef<THREE.Group | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 4;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(200, 200);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        containerRef.current.appendChild(renderer.domElement);

        const group = new THREE.Group();
        meshRef.current = group;

        const oGeometry = new THREE.TorusGeometry(1.2, 0.4, 32, 100);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b5cf6,
            metalness: 0.8,
            roughness: 0.15,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.3,
        });

        const oMesh = new THREE.Mesh(oGeometry, material);
        oMesh.castShadow = true;
        oMesh.receiveShadow = true;
        group.add(oMesh);

        const dotGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const dotMaterial = new THREE.MeshStandardMaterial({
            color: 0xa78bfa,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x8b5cf6,
            emissiveIntensity: 0.4,
        });

        const dot1 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot1.position.set(-0.8, 1.6, 0);
        dot1.castShadow = true;
        dot1.receiveShadow = true;
        group.add(dot1);

        const dot2 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot2.position.set(0.8, 1.6, 0);
        dot2.castShadow = true;
        dot2.receiveShadow = true;
        group.add(dot2);

        scene.add(group);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);

        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            if (meshRef.current) {
                meshRef.current.rotation.x += 0.005;
                meshRef.current.rotation.y += 0.008;
            }
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            renderer.dispose();
            containerRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={containerRef} className="inline-block" />;
};

export default Mini3DOmlaut;
