'use client'

import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

const MODEL_URLS = [
  '/models/The_chair_and_the_table_compressed.glb',
  '/models/The_unfinished_sofa_compressed.glb',
  '/models/the_dance_floor_and_the_light_holder_compressed.glb',
]

export function HeroCleanup() {
  useEffect(() => {
    return () => {
      MODEL_URLS.forEach((url) => {
        try {
          useGLTF.clear(url)
        } catch {
          // Ignore errors
        }
      })
    }
  }, [])

  return null
}
