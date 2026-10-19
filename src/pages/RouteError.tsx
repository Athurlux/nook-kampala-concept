import { isRouteErrorResponse, useRouteError } from 'react-router'

/** Last-resort boundary so a failed chunk load or render error never leaves a blank page. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error'
  console.error('Route error:', error)
  return (
    <main className="container not-found" id="main">
      <h1 className="page-intro__title">Something went wrong loading this page.</h1>
      <p className="lede">Please reload. Form answers are kept only in memory, so a reload clears them; saved stays are kept.</p>
      <p className="fine-print">Details: {message}</p>
      <div className="button-row">
        <button type="button" className="button button--primary" onClick={() => window.location.reload()}>Reload page</button>
        <a href="/" className="button button--outline">Go to the homepage</a>
      </div>
    </main>
  )
}
