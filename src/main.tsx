import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import App from './App'
import { PetGallery } from './dev/PetGallery'
import './index.css'

const showGallery = import.meta.env.DEV && new URLSearchParams(location.search).has('gallery')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* "user" follows the OS reduced-motion setting: transforms are dropped, opacity fades remain. */}
    <MotionConfig reducedMotion="user">{showGallery ? <PetGallery /> : <App />}</MotionConfig>
  </StrictMode>,
)
