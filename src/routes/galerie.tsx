import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { getGalleryPhotos } from '../server/queries'

export const Route = createFileRoute('/galerie')({
  loader: () => getGalleryPhotos(),
  component: GaleriePage,
})

const PAGE_SIZE = 48

function GaleriePage() {
  const allPhotos = Route.useLoaderData()
  const [page, setPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const loaderRef = useRef<HTMLDivElement>(null)

  const visible = allPhotos.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < allPhotos.length

  // Infinite scroll via IntersectionObserver
  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore) setPage(p => p + 1)
  }, [hasMore])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(onIntersect, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [onIntersect])

  // Slides pour le lightbox
  const slides = allPhotos.map(p => ({ src: p.full }))

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Galerie</h1>
          <p className="text-gray-500 mt-1">{allPhotos.length} photos • Vie du club depuis 2014</p>
        </div>

        {/* Grille masonry-like avec colonnes CSS */}
        <div
          className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2"
          style={{ columnGap: '8px' }}
        >
          {visible.map((photo, idx) => (
            <button
              key={photo.filename}
              className="block w-full mb-2 overflow-hidden rounded-lg cursor-zoom-in group focus:outline-none"
              onClick={() => setLightboxIndex(idx)}
              aria-label={`Photo ${idx + 1}`}
            >
              <img
                src={photo.thumb}
                alt=""
                loading="lazy"
                className="w-full h-auto object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
              />
            </button>
          ))}
        </div>

        {/* Sentinel infinite scroll */}
        <div ref={loaderRef} className="py-8 text-center">
          {hasMore ? (
            <span className="text-sm text-gray-400">Chargement…</span>
          ) : (
            <span className="text-sm text-gray-400">
              {allPhotos.length} photos affichées
            </span>
          )}
        </div>
      </main>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
        carousel={{ finite: false }}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.92)' } }}
      />
    </div>
  )
}
