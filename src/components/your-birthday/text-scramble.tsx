'use client'

const CHARS = '!<>-_\\/[]{}—=+*^?#________'

/**
 * TextScramble — animates an element's text by progressively replacing
 * characters with random glyphs before settling on the target string.
 *
 * Usage:
 *   const fx = new TextScramble(el)
 *   fx.setText('HELLO').then(() => { ... })
 *   fx.cancel() // stop pending animations on unmount
 */
export class TextScramble {
  private el: HTMLElement
  private queue: Array<{ from: string; to: string; start: number; end: number }> = []
  private frame = 0
  private frameRequest = 0
  private resolve: (() => void) | null = null
  private cancelled = false

  constructor(el: HTMLElement) {
    this.el = el
    this.update = this.update.bind(this)
  }

  setText(newText: string): Promise<void> {
    // Resolve any pending Promise before starting a new animation,
    // so callers awaiting the previous setText don't hang forever.
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r()
    }
    const oldText = this.el.innerText
    const length = Math.max(oldText.length, newText.length)
    const promise = new Promise<void>((resolve) => {
      this.resolve = resolve
    })
    this.queue = []
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || ''
      const to = newText[i] || ''
      const start = Math.floor(Math.random() * 40)
      const end = start + Math.floor(Math.random() * 40)
      this.queue.push({ from, to, start, end })
    }
    cancelAnimationFrame(this.frameRequest)
    this.frame = 0
    this.cancelled = false
    this.update()
    return promise
  }

  /** Stop any pending animation immediately. */
  cancel(): void {
    this.cancelled = true
    cancelAnimationFrame(this.frameRequest)
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r()
    }
  }

  private update() {
    if (this.cancelled) return
    let output = ''
    let complete = 0
    for (let i = 0; i < this.queue.length; i++) {
      const { from, to, start, end } = this.queue[i]
      let char = ''
      if (this.frame >= end) {
        complete++
        output += to
      } else if (this.frame >= start) {
        if (Math.random() < 0.28) {
          char = CHARS[Math.floor(Math.random() * CHARS.length)]
          output += `<span style="opacity:0.5">${char}</span>`
        } else {
          output += from
        }
      } else {
        output += from
      }
    }
    this.el.innerHTML = output
    if (complete === this.queue.length) {
      if (this.resolve) {
        const r = this.resolve
        this.resolve = null
        r()
      }
    } else {
      this.frameRequest = requestAnimationFrame(this.update)
      this.frame++
    }
  }
}
