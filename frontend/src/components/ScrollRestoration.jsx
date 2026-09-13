import {
  useEffect,
  useRef,
} from 'react'

import {
  useLocation,
} from 'react-router-dom'

// Keeps scroll positions only while
// the app stays open.
//
// Refreshing the page clears them.
const scrollPositions = {}

function ScrollRestoration() {
  const location = useLocation()

  const previousPath =
    useRef(location.pathname)

  useEffect(() => {
    const currentPath =
      location.pathname

    const oldPath =
      previousPath.current

    // Save where we left the old page.
    if (oldPath !== currentPath) {
      scrollPositions[oldPath] =
        window.scrollY
    }

    // The preference quiz should always
    // open recommendations from the top.
    const comingFromQuiz =
      location.state?.fromQuiz === true

    const targetPosition =
      comingFromQuiz
        ? 0
        : scrollPositions[
            currentPath
          ] ?? 0

    // Wait until the new page renders
    // before restoring its position.
    requestAnimationFrame(() => {
      window.scrollTo({
        top: targetPosition,
        left: 0,
        behavior: 'instant',
      })
    })

    previousPath.current =
      currentPath
  }, [
    location.pathname,
    location.state,
  ])

  return null
}

export default ScrollRestoration