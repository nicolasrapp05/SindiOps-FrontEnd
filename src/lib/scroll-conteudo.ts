/** cubic-bezier(0.2, 0, 0, 1) — o mesmo --ease-corporate do restante da interface. */
function easeCorporate(time: number): number {
  let guess = time
  for (let i = 0; i < 6; i++) {
    const current = bezier(guess, 0.2, 0) - time
    const slope = bezierSlope(guess, 0.2, 0)
    if (Math.abs(slope) < 1e-4) break
    guess = Math.min(1, Math.max(0, guess - current / slope))
  }
  return bezier(guess, 0, 1)
}

function bezier(t: number, a1: number, a2: number): number {
  return ((bezierA(a1, a2) * t + bezierB(a1, a2)) * t + bezierC(a1)) * t
}

function bezierSlope(t: number, a1: number, a2: number): number {
  return 3 * bezierA(a1, a2) * t * t + 2 * bezierB(a1, a2) * t + bezierC(a1)
}

function bezierA(a1: number, a2: number): number {
  return 1 - 3 * a2 + 3 * a1
}

function bezierB(a1: number, a2: number): number {
  return 3 * a2 - 6 * a1
}

function bezierC(a1: number): number {
  return 3 * a1
}

let frame = 0
let detachUserCancel: (() => void) | null = null

export function cancelScrollConteudo() {
  detachUserCancel?.()
  detachUserCancel = null
  cancelAnimationFrame(frame)
}

/** Leva o painel principal de volta ao topo, desacelerando no final. */
export function scrollConteudoToTop() {
  cancelScrollConteudo()

  const scroller = document.getElementById("conteudo")
  if (!scroller) return

  const from = scroller.scrollTop
  if (from <= 0) return

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduceMotion) {
    scroller.scrollTop = 0
    return
  }

  const duration = 480
  const start = performance.now()

  const detach = () => {
    scroller.removeEventListener("wheel", cancel)
    scroller.removeEventListener("touchmove", cancel)
    if (detachUserCancel === detach) detachUserCancel = null
  }

  const cancel = () => {
    cancelAnimationFrame(frame)
    detach()
  }

  detachUserCancel = detach
  scroller.addEventListener("wheel", cancel, { passive: true })
  scroller.addEventListener("touchmove", cancel, { passive: true })

  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    scroller.scrollTop = from * (1 - easeCorporate(progress))
    if (progress < 1) {
      frame = requestAnimationFrame(step)
      return
    }
    detach()
  }

  frame = requestAnimationFrame(step)
}
