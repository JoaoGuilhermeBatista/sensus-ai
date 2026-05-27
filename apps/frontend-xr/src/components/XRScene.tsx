import { Canvas } from '@react-three/fiber'
import { XR, Controllers, Hands, useController } from '@react-three/xr'
import type { ReactNode } from 'react'

function ControllerPointer({ hand }: { hand: 'left' | 'right' }) {
  const controller = useController(hand)
  if (!controller?.controller) return null
  return (
    <primitive object={controller.controller}>
      <mesh position={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.004, 0.004, 0.3, 8]} />
        <meshBasicMaterial color={hand === 'left' ? '#ff0055' : '#00ffcc'} transparent opacity={0.85} />
      </mesh>
    </primitive>
  )
}

/**
 * Cena XR. O `<XR>` recebe o store via prop (`store`) para que o botão de AR,
 * montado fora do Canvas, controle a MESMA sessão — sem isso o passthrough não
 * conecta no renderer e a tela fica preta.
 */
export function XRScene({ children }: { children?: ReactNode }) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: false, preserveDrawingBuffer: false }}
      camera={{ fov: 75 }}
      // ClearColor totalmente transparente: deixa o passthrough da câmera aparecer atrás.
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.setClearAlpha(0)
      }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={0.8} />
      <XR referenceSpace="local-floor">
        <Controllers />
        <Hands />
        <ControllerPointer hand="left" />
        <ControllerPointer hand="right" />
        {children}
      </XR>
    </Canvas>
  )
}
