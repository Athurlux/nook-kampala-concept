import { useEffect } from 'react'

const SITE = 'Nook Kampala'

export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · Apartments & stays across Kampala`
  }, [title])
}
