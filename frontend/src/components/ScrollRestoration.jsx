import {
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'

import {
  useLocation,
} from 'react-router-dom'

// Stored only in memory.
//
// Refreshing the browser clears this object,
// so every page starts fresh after refresh.
const scrollPositions = {}

function ScrollRestoration() {
  const location = useLocation()

  const isRestoring =
    useRef(false)

  /*
   * Disable the browser's built-in
   * restoration so it does not fight
   * with our own.
   */
  useEffect(() => {
    if (
      'scrollRestoration' in
      window.history
    ) {
      window.history.scrollRestoration =
        'manual'
    }

    return () => {
      if (
        'scrollRestoration' in
        window.history
      ) {
        window.history.scrollRestoration =
          'auto'
      }
    }
  }, [])

  /*
   * Save the current page's scroll
   * position while the user scrolls.
   *
   * The pathname is captured by this
   * effect, so each page gets its own
   * independent position.
   */
  useEffect(() => {
    const path =
      location.pathname

    const saveScrollPosition = () => {
      if (isRestoring.current) {
        return
      }

      scrollPositions[path] =
        window.scrollY
    }

    window.addEventListener(
      'scroll',
      saveScrollPosition,
      {
        passive: true,
      }
    )

    return () => {
      window.removeEventListener(
        'scroll',
        saveScrollPosition
      )
    }
  }, [location.pathname])

  /*
   * Restore the new page.
   *
   * useLayoutEffect runs before the
   * browser paints the route change,
   * which helps prevent one page from
   * inheriting another page's scroll.
   */
  useLayoutEffect(() => {
    const path =
      location.pathname

    const comingFromQuiz =
      location.state?.fromQuiz === true

    /*
     * Finishing the quiz always creates
     * a fresh Explore experience.
     */
    if (
      path === '/recommendations' &&
      comingFromQuiz
    ) {
      scrollPositions[
        '/recommendations'
      ] = 0

      isRestoring.current = true

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      })

      requestAnimationFrame(() => {
        isRestoring.current = false
      })

      return
    }

    const targetPosition =
      scrollPositions[path] ?? 0

    isRestoring.current = true

    let cancelled = false
    let frameId = null
    let observer = null
    let fallbackTimer = null

    const restore = () => {
      if (cancelled) {
        return
      }

      const documentHeight =
        document.documentElement
          .scrollHeight

      const maximumScroll =
        Math.max(
          0,
          documentHeight -
            window.innerHeight
        )

      /*
       * The page is tall enough to reach
       * its old position.
       */
      if (
        maximumScroll >=
        targetPosition
      ) {
        window.scrollTo({
          top: targetPosition,
          left: 0,
          behavior: 'instant',
        })

        /*
         * Wait two frames before saving
         * scroll events again.
         */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) {
              isRestoring.current =
                false
            }
          })
        })

        if (observer) {
          observer.disconnect()
        }

        if (fallbackTimer) {
          window.clearTimeout(
            fallbackTimer
          )
        }

        return
      }

      /*
       * If the target is 0, there is
       * nothing to wait for.
       */
      if (targetPosition === 0) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        })

        requestAnimationFrame(() => {
          isRestoring.current = false
        })

        return
      }
    }

    /*
     * Try once after React has rendered
     * the new route.
     */
    frameId =
      requestAnimationFrame(restore)

    /*
     * Some pages grow after API data,
     * product cards, images, etc. render.
     *
     * ResizeObserver notices that growth
     * and retries restoration.
     */
    observer =
      new ResizeObserver(() => {
        restore()
      })

    observer.observe(
      document.documentElement
    )

    /*
     * Safety fallback so restoration
     * cannot remain locked forever.
     */
    fallbackTimer =
      window.setTimeout(() => {
        if (cancelled) {
          return
        }

        const maximumScroll =
          Math.max(
            0,
            document.documentElement
              .scrollHeight -
              window.innerHeight
          )

        window.scrollTo({
          top: Math.min(
            targetPosition,
            maximumScroll
          ),
          left: 0,
          behavior: 'instant',
        })

        isRestoring.current = false

        observer?.disconnect()
      }, 5000)

    return () => {
      cancelled = true

      if (frameId) {
        cancelAnimationFrame(
          frameId
        )
      }

      if (fallbackTimer) {
        window.clearTimeout(
          fallbackTimer
        )
      }

      observer?.disconnect()

      /*
       * Release the lock before the
       * next route handles restoration.
       */
      isRestoring.current = false
    }
  }, [
    location.pathname,
    location.state,
  ])

  return null
}

export default ScrollRestoration