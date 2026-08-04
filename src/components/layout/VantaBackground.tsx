'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const [vantaEffect, setVantaEffect] = useState<any>(null)

  useEffect(() => {
    let effect: any = null;
    
    // Dynamic import to avoid SSR issues since Vanta uses window
    import('vanta/dist/vanta.clouds2.min').then((Vanta) => {
      // Vanta default export is sometimes weirdly packaged
      const CLOUDS2 = Vanta.default || Vanta;
      
      if (!effect && vantaRef.current) {
        try {
          effect = CLOUDS2({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            skyColor: 0x0,
            cloudColor: 0x252528,
            speed: 0.30,
            texturePath: "/gallery/noise.png"
          })
          setVantaEffect(effect)
        } catch (e) {
          console.error("Vanta init failed:", e)
        }
      }
    });
    
    return () => {
      if (effect) effect.destroy()
    }
  }, []) // Empty dependency array to run only once

  return (
    <div 
      ref={vantaRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  )
}
