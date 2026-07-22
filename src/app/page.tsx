'use client'

import Image from 'next/image'

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '2rem',
        padding: '1rem',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '6rem',
          height: '6rem',
        }}
      >
        <Image
          src="/logo.svg"
          alt="Z.ai Logo"
          fill
          style={{
            objectFit: 'contain',
          }}
          priority
        />
      </div>
    </div>
  )
}
