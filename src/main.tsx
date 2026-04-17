import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store } from '@/store'
import App from '@/App'
import '@/index.css'

const el = document.getElementById('root')
if (!el) throw new Error('root element not found')

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(el).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={basename}>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
