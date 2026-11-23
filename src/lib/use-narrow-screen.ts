import { useEffect, useState } from "react"

const NARROW_QUERY = "(max-width: 767px)"

export function useNarrowScreen() {
  const [matches, setMatches] = useState(() => window.matchMedia(NARROW_QUERY).matches)

  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY)
    const onChange = () => setMatches(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return matches
}
