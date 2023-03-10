import { useRef, useEffect } from "react";
import { OrbitControls, Plane, shaderMaterial } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import glsl from "babel-plugin-glsl/macro";
import * as THREE from "three";

import { useSpring } from "@react-spring/web";

import { useGLTF } from "@react-three/drei";

const CustomShader = shaderMaterial(
  {
    time: { value: 0 },
  },
  glsl`
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;   

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  glsl`
    varying vec2 vUv;     
    uniform float time; 



    vec4 Muzzle( vec2 uv)
    {
        vec2 u = ( uv.yx * vec2(-0.2,.8) - uv) / 0.05;
       
        
      float T = floor(  time * 20.),
           theta = atan(u.y + 2.2, u.x),
           len = (5.0 + sin(theta * 20. - T * 35.)) / 0.8;
           u.x *=  2.;
        
        
        float d = max(-0.6, 1. - length(u)/len);
        return d*(1.+.5* vec4( 0.0,
        -cos(theta *  6. - T *14.77),
                            0.0,
                               0.0));
    }


    const float SPEED = 5.0;
    const float FREQ = 8.0;
    const float MAX_HEIGHT = 0.05;
    const float THICKNESS = 0.02;
    const float BLOOM = 1.85; // above 1 will reduce
    const float WOBBLE = 2.0; // how much each end wobbles
    
    float beam(vec2 uv, float max_height, float offset, float speed, float freq, float thickness) {
      uv.y -= 0.5;
    
      float height = max_height * (WOBBLE + min(1. - uv.x, 1.));
    
      // Ramp makes the left hand side stay at/near 0
      float ramp = smoothstep(0., 2.0 / freq, uv.x);
    
      height *= ramp;
      uv.y += sin(uv.x * freq - time * speed + offset) * height;
    
      float f = thickness / abs(uv.y);
      f = pow(f, BLOOM);
      
      return f;
    }

    

    void main() {	    
      float f = beam(1.0 - vUv, MAX_HEIGHT, 0., SPEED, FREQ * 1.5, THICKNESS * 0.5) + 
			  beam(1.0 - vUv, MAX_HEIGHT, time, SPEED, FREQ, THICKNESS) +
			  beam(1.0 - vUv, MAX_HEIGHT, time + 0.5, SPEED + 0.2, FREQ * 0.9, THICKNESS * 0.5);


        vec3 color = f * vec3(1.0, 0.83, 0.2);
        
      
       color.r *=  1.0 / (distance(vec2((1.0 - vUv.x + 0.5), (1.0 - vUv.y - 0.5) * 2.5 + 0.5), vec2(0.5)));
       color.g *=  0.83  / (distance(vec2((1.0 - vUv.x + 0.5), (1.0 - vUv.y - 0.5) * 2.5 + 0.5), vec2(0.5)));
       color.b *=  0.2  / (distance(vec2((1.0 - vUv.x + 0.5), (1.0 - vUv.y - 0.5) * 2.5 + 0.5), vec2(0.5)));

       gl_FragColor = vec4(color, 0.0);
    }
        `
);

extend({ CustomShader });

function Bow(props) {
  const { nodes, materials } = useGLTF("/bow.glb");

  const ref = useRef(null);

  const materialRef = useRef(null);

  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.getElapsedTime();
      materialRef.current.uniforms.time.value = t;
    }
  });

  return (
    <mesh
      geometry={nodes.Plane.geometry}
      position={[3.5, 0.2, 1.9]}
      rotation={[0.0, 0.04, 0.2]}
    >
      <customShader
        ref={materialRef}
        attach="material"
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Box(props) {
  const ref = useRef(null);
  const materialRef = useRef(null);

  useFrame((state, delta) => {
    if (materialRef.current) {
      const t = state.clock.getElapsedTime();
      materialRef.current.uniforms.time.value = t;

      // ref.current.rotation.x += delta;
    }
  });

  return (
    <mesh
      {...props}
      ref={ref}
      // rotation={[0.1, 0.2, 0.25]}
      // position={[1.2, -2, -1.8]}
    >
      <planeBufferGeometry args={[10, 2]} />
      <customShader
        ref={materialRef}
        attach="material"
        transparent={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function HealingSpell() {
  const springs = useSpring({
    from: { x: 0 },
    to: { x: 100 },
  });

  useEffect(() => {
    springs.x.start();
    console.log(springs.x.get());
  });

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />

      <Bow />
      {/* <Box position={[0, 0, 0]} /> */}

      {/* <OrbitControls /> */}
    </Canvas>
  );
}

export default HealingSpell;
useGLTF.preload("/bow.glb");
