import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // 🔥 Import kiya
import App from './App'
import './index.css'
import { Toaster } from 'sonner'

// 🔥 QueryClient banaya (Yeh data ko cache karega)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minute tak data fresh rahega, bar bar load nahi hoga
      refetchOnWindowFocus: false, // Window switch karne par bar bar load nahi hoga
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)