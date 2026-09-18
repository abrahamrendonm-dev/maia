import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { BlogChannelPage } from './pages/blog/BlogChannelPage.tsx'
import { BlogPostPage } from './pages/blog/BlogPostPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/blog/:channel" element={<BlogChannelPage />} />
        <Route path="/blog/:channel/:slug" element={<BlogPostPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
