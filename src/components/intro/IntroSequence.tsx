'use client'

import { useEffect, useRef, useState } from 'react'

const FRAME_COUNT = 288
const DURATION_MS = 16000
const REVEAL_START_MS = 13500
const REVEAL_DURATION_MS = 3000
const FRAME_DIR = '/intro/images%20intro'
const AUDIO_SRC = '/intro/song%20mp3.MP3'

function framePath(n: number): string {
  return `${FRAME_DIR}/ezgif-frame-${String(n).padStart(3, '0')}.jpg`
}

interface IntroSequenceProps {
  /** Appelé une seule fois, à 13,5s : le point de départ du dévoilement de l'écran de connexion. */
  onRevealStart?: () => void
  /** Appelé une fois l'intro entièrement effacée de l'écran. */
  onComplete?: () => void
}

/**
 * Séquence d'ouverture : 288 images défilées à la cadence de la vidéo
 * source (~16 s), musique en fond. À 13,5 s, l'intro commence à s'effacer en
 * fondu pour révéler l'écran de connexion, qui se déflout en même temps
 * (piloté séparément par le parent via onRevealStart).
 *
 * Pas de bouton : la musique démarre seule au montage, et cliquer n'importe
 * où sur l'écran pendant l'intro coupe le son (un second clic le rétablit).
 */
export function IntroSequence({ onRevealStart, onComplete }: IntroSequenceProps) {
  const [frame, setFrame] = useState(1)
  const [fadingOut, setFadingOut] = useState(false)
  const [mounted, setMounted] = useState(true)

  const loadedRef = useRef<Set<number>>(new Set())
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const revealFiredRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Préchargement de toutes les frames en parallèle ; la lecture démarre
    // immédiatement et n'affiche que la dernière frame déjà chargée, pour ne
    // jamais montrer une image cassée le temps que le reste arrive.
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image()
      img.onload = () => loadedRef.current.add(i)
      img.src = framePath(i)
    }

    audioRef.current?.play().catch((err) => {
      console.error('Intro: lecture audio impossible', err)
    })

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current

      const target = Math.min(FRAME_COUNT, Math.max(1, Math.ceil((elapsed / DURATION_MS) * FRAME_COUNT)))
      let toShow = target
      while (toShow > 1 && !loadedRef.current.has(toShow)) toShow--
      setFrame(toShow)

      if (!revealFiredRef.current && elapsed >= REVEAL_START_MS) {
        revealFiredRef.current = true
        setFadingOut(true)
        onRevealStart?.()
        window.setTimeout(() => {
          setMounted(false)
          onComplete?.()
        }, REVEAL_DURATION_MS)
      }

      if (elapsed < DURATION_MS && !revealFiredRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (elapsed < REVEAL_START_MS + REVEAL_DURATION_MS) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSound = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch((err) => console.error('Intro: lecture audio impossible', err))
    } else {
      audio.pause()
    }
  }

  if (!mounted) return null

  return (
    <div
      onClick={toggleSound}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black cursor-pointer"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${REVEAL_DURATION_MS}ms ease-out`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={framePath(frame)} alt="" className="h-full w-full object-cover" draggable={false} />
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />
    </div>
  )
}
