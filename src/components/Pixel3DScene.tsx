import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Pixel3DScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Helper to create a voxel (box)
    const createVoxel = (x: number, y: number, z: number, color: number, size: number = 0.2) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x * size, y * size, z * size);
      return mesh;
    };

    // 1. Create Voxel Microphone
    const micGroup = new THREE.Group();
    // Handle
    for (let y = 0; y < 5; y++) {
      micGroup.add(createVoxel(0, y, 0, 0x333333));
    }
    // Head
    for (let x = -1; x <= 1; x++) {
      for (let y = 5; y <= 7; y++) {
        for (let z = -1; z <= 1; z++) {
          micGroup.add(createVoxel(x, y, z, 0x999999));
        }
      }
    }
    scene.add(micGroup);
    micGroup.position.set(-3.5, 0, 0); // Moved further left

    // 2. Create Voxel Tomato
    const tomatoGroup = new THREE.Group();
    // Body
    for (let x = -1; x <= 1; x++) {
      for (let y = 0; y <= 2; y++) {
        for (let z = -1; z <= 1; z++) {
          if (Math.abs(x) + Math.abs(y-1) + Math.abs(z) <= 2) {
            tomatoGroup.add(createVoxel(x, y, z, 0xff0000));
          }
        }
      }
    }
    // Stem
    tomatoGroup.add(createVoxel(0, 3, 0, 0x00ff00));
    tomatoGroup.add(createVoxel(1, 3, 0, 0x00ff00));
    scene.add(tomatoGroup);
    tomatoGroup.position.set(3.5, 0, 0); // Moved further right

    camera.position.z = 6;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      micGroup.rotation.y += 0.02;
      micGroup.position.y = Math.sin(Date.now() * 0.002) * 0.2;

      tomatoGroup.rotation.y -= 0.01;
      tomatoGroup.rotation.x += 0.01;
      tomatoGroup.position.y = Math.cos(Date.now() * 0.0015) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-64" />;
};

export default Pixel3DScene;
