import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { getGalleryPhotos } from '../server/queries'

export const Route = createFileRoute('/galerie')({
  loader: () => getGalleryPhotos(),
  component: GaleriePage,
})

const PAGE_SIZE = 60

function GaleriePage() {
  const allPhotos = Route.useLoaderData()
  const [page, setPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const loaderRef = useRef<HTMLDivElement>(null)

  const visible = allPhotos.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < allPhotos.length

  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore) setPage(p => p + 1)
  }, [hasMore])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(onIntersect, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [onIntersect])

  const slides = allPhotos.map(p => ({ src: p.full }))

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Galerie</h1>
          <p className="text-gray-500 mt-1">{allPhotos.length} photos · Vie du club depuis 2014</p>
          <p className="text-gray-500 mt-2 max-w-2xl text-sm">Matchs, tournois, moments de partage... retrouvez tous les souvenirs photographiques du HBSME. Cliquez sur une photo pour l'agrandir.</p>
        </div>

        {/* Grille uniforme — ratio fixe pour éviter tout layout shift */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
          {visible.map((photo, idx) => (
            <button
              key={photo.filename}
              className="relative block overflow-hidden rounded-md cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              style={{ aspectRatio: '1 / 1' }}
              onClick={() => setLightboxIndex(idx)}
              aria-label={`Photo ${idx + 1}`}
            >
              {/* Placeholder gris pendant le chargement */}
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              <img
                src={photo.thumb}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:brightness-90 transition-all duration-300"
                onLoad={e => {
                  // Retirer le placeholder une fois chargé
                  const placeholder = (e.target as HTMLImageElement).previousElementSibling as HTMLElement
                  if (placeholder) placeholder.style.display = 'none'
                }}
              />
            </button>
          ))}
        </div>

        <div ref={loaderRef} className="py-10 text-center">
          {hasMore ? (
            <span className="text-sm text-gray-400">Chargement…</span>
          ) : (
            <span className="text-sm text-gray-400">{allPhotos.length} photos affichées</span>
          )}
        </div>
      </main>

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
