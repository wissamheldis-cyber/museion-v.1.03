'use client'

import { useEffect, useRef, useState } from 'react'

const FRAME_COUNT = 288
const DURATION_MS = 16000
const REVEAL_START_MS = 13500
const REVEAL_DURATION_MS = 3000
const LOGO_APPEAR_MS = 11000
const FRAME_DIR = '/intro/images%20intro'
const AUDIO_SRC = '/intro/song%20mp3.MP3'
const LOGO_SRC = '/brand/logo-login.png'

function framePath(n: number): string {
  return `${FRAME_DIR}/ezgif-frame-${String(n).padStart(3, '0')}.jpg`
}

interface IntroSequenceProps {
  /** Appelé une seule fois, à 13,5s : le point de départ du dévoilement de l'écran de connexion. */
  onRevealStart?: () => void
  /** Appelé une fois l'intro entièrement effacée de l'écran. */
  onComplete?: () => void
}

// Filet de sécurité si la musique ne se termine jamais (erreur de lecture,
// métadonnées indisponibles) : on ne laisse pas l'overlay invisible vivre
// indéfiniment dans le DOM.
const AUDIO_FAILSAFE_MS = 30000

/**
 * Séquence d'ouverture : 288 images défilées à la cadence de la vidéo
 * source (~16 s), musique en fond. À 13,5 s, l'intro commence à s'effacer en
 * fondu pour révéler l'écran de connexion, qui se déflout en même temps
 * (piloté séparément par le parent via onRevealStart) ; une fois le fondu
 * terminé l'overlay devient invisible et cliquable au travers (le formulaire
 * de connexion redevient utilisable), mais reste monté — et la musique
 * continue de jouer — jusqu'à la fin réelle du morceau.
 *
 * Le son démarre seul au montage et ne peut pas être coupé : aucun contrôle,
 * aucun bouton, aucun clic n'agit dessus.
 *
 * À 11s, le logo Museion apparaît en fondu par-dessus les images, pendant
 * que l'intro joue encore ; il s'efface ensuite avec le reste de l'overlay
 * à partir de 13,5s.
 */
export function IntroSequence({ onRevealStart, onComplete }: IntroSequenceProps) {
  const [frame, setFrame] = useState(1)
  const [fadingOut, setFadingOut] = useState(false)
  const [logoVisible, setLogoVisible] = useState(false)
  const [mounted, setMounted] = useState(true)

  const loadedRef = useRef<Set<number>>(new Set())
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const logoAppearFiredRef = useRef(false)
  const revealFiredRef = useRef(false)
  const finishedRef = useRef(false)
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

    const finishIntro = () => {
      if (finishedRef.current) return
      finishedRef.current = true
      setMounted(false)
      onComplete?.()
    }

    const audio = audioRef.current
    audio?.play().catch((err) => {
      console.error('Intro: lecture audio impossible', err)
    })
    audio?.addEventListener('ended', finishIntro)
    const failsafeTimer = window.setTimeout(finishIntro, AUDIO_FAILSAFE_MS)

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current

      const target = Math.min(FRAME_COUNT, Math.max(1, Math.ceil((elapsed / DURATION_MS) * FRAME_COUNT)))
      let toShow = target
      while (toShow > 1 && !loadedRef.current.has(toShow)) toShow--
      setFrame(toShow)

      if (!logoAppearFiredRef.current && elapsed >= LOGO_APPEAR_MS) {
        logoAppearFiredRef.current = true
        setLogoVisible(true)
      }

      if (!revealFiredRef.current && elapsed >= REVEAL_START_MS) {
        revealFiredRef.current = true
        setFadingOut(true)
        onRevealStart?.()
      }

      if (elapsed < REVEAL_START_MS + REVEAL_DURATION_MS) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.clearTimeout(failsafeTimer)
      audio?.removeEventListener('ended', finishIntro)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        style={{
          opacity: fadingOut ? 0 : 1,
          pointerEvents: fadingOut ? 'none' : 'auto',
          transition: `opacity ${REVEAL_DURATION_MS}ms ease-out`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={framePath(frame)} alt="" className="h-full w-full object-cover" draggable={false} />
        <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />
      </div>
      <div
        className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
        style={{
          opacity: fadingOut ? 0 : logoVisible ? 1 : 0,
          transition: `opacity ${REVEAL_DURATION_MS}ms ease-out`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="Museion"
          className="w-[48rem] max-w-[92vw]"
          style={{ aspectRatio: '1771 / 279' }}
          draggable={false}
        />
      </div>
    </>
  )
}
