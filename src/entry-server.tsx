import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { QueryClientProvider, dehydrate } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import App from './App'

export function render(url: string, context: any) {
  const html = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StaticRouter>
  )

  // Hydratation data for React Query
  const dehydratedState = dehydrate(queryClient)

  return {
    html,
    state: dehydratedState,
  }
} 