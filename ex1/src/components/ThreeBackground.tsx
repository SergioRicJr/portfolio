import { type MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
// @ts-ignore - tipos do maath não expostos
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

const PARTICLE_COUNT = 1500;
const ORB_COUNT = 4;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec3 uMouse;
uniform float uPointerStrength;
attribute float aScale;
attribute float aSpeed;
attribute float aPhase;
varying float vAlpha;
varying float vDepth;
varying float vPulse;

void main() {
    vec3 pos = position;
    float time = uTime * (0.35 + aSpeed * 0.2);

    pos.x += sin(time + aPhase) * 0.12;
    pos.y += cos(time * 0.8 + aPhase) * 0.12;
    pos.z += sin(time * 0.6 + aPhase) * 0.2;

    vec2 dir = pos.xy - uMouse.xy;
    float dist = length(dir) + 0.05;
    vec2 push = dir / dist;
    float strength = mix(0.15, 0.45, clamp(uPointerStrength, 0.0, 1.5));
    pos.xy += push * (strength / dist);

    float swirl = sin((pos.x + pos.y + pos.z) * 6.0 + uTime);
    vec2 tangent = vec2(-push.y, push.x);
    pos.xz += tangent * swirl * 0.08;

    vAlpha = 1.0 - smoothstep(0.0, 1.2, dist);
    vDepth = smoothstep(-0.8, 0.8, pos.z);
    vPulse = swirl * 0.5 + 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = aScale * (25.0 + (uPointerStrength * 8.0));
    gl_PointSize = size * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uHighlight;
uniform float uIntensity;
varying float vAlpha;
varying float vDepth;
varying float vPulse;

void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float mask = smoothstep(0.5, 0.0, d);
    vec3 baseGradient = mix(uColor, uAccent, clamp(vDepth, 0.0, 1.0));
    vec3 color = mix(baseGradient, uHighlight, vPulse * 0.35) * uIntensity;

    gl_FragColor = vec4(color, mask * vAlpha);
}
`;

type PointerRefs = {
    pointer: MutableRefObject<THREE.Vector2>;
    pointerTarget: MutableRefObject<THREE.Vector2>;
    pointerStrength: MutableRefObject<number>;
};

const ParticleField = ({ pointer, pointerTarget, pointerStrength }: PointerRefs) => {
    const pointsRef = useRef<THREE.Points | null>(null);
    const { theme } = useTheme();
    const prevPointer = useRef(new THREE.Vector2());
    const tempPointer = useRef(new THREE.Vector2());

    const attributes = useMemo(() => {
        const positions = random.inSphere(new Float32Array(PARTICLE_COUNT * 3), { radius: 1.4 });
        const scales = new Float32Array(PARTICLE_COUNT);
        const speeds = new Float32Array(PARTICLE_COUNT);
        const phases = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            scales[i] = Math.random() * 1.5 + 0.5;
            speeds[i] = Math.random();
            phases[i] = Math.random() * Math.PI * 2;
        }

        return { positions, scales, speeds, phases };
    }, []);

    const uniforms = useRef({
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uColor: { value: new THREE.Color('#00f3ff') },
        uAccent: { value: new THREE.Color('#ff00e0') },
        uHighlight: { value: new THREE.Color('#f8ffae') },
        uIntensity: { value: 1 },
        uPointerStrength: { value: 0.3 },
    });

    useEffect(() => {
        uniforms.current.uColor.value.set(theme === 'light' ? '#0284c7' : '#00f3ff');
        uniforms.current.uAccent.value.set(theme === 'light' ? '#9333ea' : '#ff00e0');
        uniforms.current.uHighlight.value.set(theme === 'light' ? '#fca5a5' : '#ffdc5d');
        uniforms.current.uIntensity.value = theme === 'light' ? 0.5 : 0.8;
    }, [theme]);

    useFrame((_, delta) => {
        pointer.current.lerp(pointerTarget.current, 0.065);
        tempPointer.current.copy(pointer.current).sub(prevPointer.current);
        const velocity = tempPointer.current.length() / Math.max(delta, 0.016);
        const normalized = THREE.MathUtils.clamp(THREE.MathUtils.lerp(pointerStrength.current, velocity * 0.5, 0.08), 0.05, 1.5);
        pointerStrength.current = normalized;
        uniforms.current.uPointerStrength.value = normalized;
        uniforms.current.uMouse.value.set(pointer.current.x, pointer.current.y, 0);
        uniforms.current.uTime.value += delta;
        prevPointer.current.copy(pointer.current);

        if (pointsRef.current) {
            pointsRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={attributes.positions}
                    count={attributes.positions.length / 3}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aScale"
                    array={attributes.scales}
                    count={attributes.scales.length}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aSpeed"
                    array={attributes.speeds}
                    count={attributes.speeds.length}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aPhase"
                    array={attributes.phases}
                    count={attributes.phases.length}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                uniforms={uniforms.current}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

type FloatingOrbsProps = Pick<PointerRefs, 'pointer' | 'pointerStrength'>;

const FloatingOrbs = ({ pointer, pointerStrength }: FloatingOrbsProps) => {
    const groupRef = useRef<THREE.Group | null>(null);
    const { theme } = useTheme();

    const orbs = useMemo(
        () =>
            new Array(ORB_COUNT).fill(0).map(() => ({
                radius: 0.6 + Math.random() * 0.8,
                vertical: 0.2 + Math.random() * 0.35,
                speed: 0.3 + Math.random() * 0.4,
                size: 0.012 + Math.random() * 0.02,
                offset: Math.random() * Math.PI * 2,
            })),
        []
    );

    const palette = theme === 'light' ? ['#67e8f9', '#c084fc', '#fb7185'] : ['#00f3ff', '#ff00e0', '#f59e0b'];

    useFrame(({ clock }) => {
        const elapsed = clock.getElapsedTime();
        if (!groupRef.current) return;

        groupRef.current.children.forEach((child, idx) => {
            const orb = orbs[idx];
            const angle = elapsed * orb.speed + orb.offset;
            const x = Math.cos(angle) * orb.radius + pointer.current.x * 0.25;
            const y = Math.sin(angle * 1.2) * orb.vertical + pointer.current.y * 0.25;
            const z = Math.sin(angle * 0.6) * (orb.radius * 0.5);

            child.position.set(x, y, z);

            const scale = (orb.size + pointerStrength.current * 0.02) * 40;
            child.scale.setScalar(scale);
            child.rotation.y += 0.01;
        });
    });

    return (
        <group ref={groupRef}>
            {orbs.map((orb, idx) => (
                <mesh key={`${orb.radius}-${idx}`}>
                    <sphereGeometry args={[orb.size, 16, 16]} />
                    <meshStandardMaterial
                        color={palette[idx % palette.length]}
                        emissive={palette[idx % palette.length]}
                        emissiveIntensity={theme === 'light' ? 0.5 : 1.0}
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            ))}
        </group>
    );
};

export const ThreeBackground = () => {
    const pointer = useRef(new THREE.Vector2());
    const pointerTarget = useRef(new THREE.Vector2());
    const pointerStrength = useRef(0.25);
    const { theme } = useTheme();

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = -(event.clientY / window.innerHeight) * 2 + 1;
            pointerTarget.current.set(x, y);
        };

        const handlePointerLeave = () => {
            pointerTarget.current.set(0, 0);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerleave', handlePointerLeave);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerleave', handlePointerLeave);
        };
    }, []);

    return (
        <div className="absolute inset-0 -z-10 h-full w-full pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 2.5], fov: 60 }}
                dpr={[1, 2]}
                gl={{ alpha: true, powerPreference: 'high-performance' }}
            >
                <ambientLight intensity={theme === 'light' ? 0.6 : 0.3} />
                <pointLight
                    position={[2, 3, 2]}
                    intensity={theme === 'light' ? 0.8 : 1.2}
                    color={theme === 'light' ? '#e0f2fe' : '#f0abfc'}
                />
                <ParticleField pointer={pointer} pointerTarget={pointerTarget} pointerStrength={pointerStrength} />
                <FloatingOrbs pointer={pointer} pointerStrength={pointerStrength} />
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/40 via-transparent to-dark-bg/80" />
        </div>
    );
};
