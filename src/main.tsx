import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { BlogHome } from './pages/blog/BlogHome.tsx'
import { BlogChannelPage } from './pages/blog/BlogChannelPage.tsx'
import { BlogPostPage } from './pages/blog/BlogPostPage.tsx'
import { RequireEditor } from './pages/blog-editor/RequireEditor.tsx'
import { BlogEditorList } from './pages/blog-editor/BlogEditorList.tsx'
import { BlogEditorForm } from './pages/blog-editor/BlogEditorForm.tsx'
import { BlogResourcesAdmin } from './pages/blog-editor/BlogResourcesAdmin.tsx'

// Estructura del dominio (guardianadelavida.com): el blog "Guardiana de la
// Vida" vive en la raíz, la app MAIA se mueve a /maia. React Router v6
// prioriza segmentos estáticos ("maia", "blog-editor") sobre los dinámicos
// (:channel, :slug), así que no hay choque entre /maia, /blog-editor y las
// rutas de canal/post aunque /:channel sea de un solo segmento.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        <Route path="/" element={<BlogHome />} />
        <Route
          path="/blog-editor"
          element={
            <RequireEditor>
              <BlogEditorList />
            </RequireEditor>
          }
        />
        <Route
          path="/blog-editor/recursos"
          element={
            <RequireEditor>
              <BlogResourcesAdmin />
            </RequireEditor>
          }
        />
        <Route
          path="/blog-editor/:id"
          element={
            <RequireEditor>
              <BlogEditorForm />
            </RequireEditor>
          }
        />
        <Route path="/maia/*" element={<App />} />
        <Route path="/:channel" element={<BlogChannelPage />} />
        <Route path="/:channel/:slug" element={<BlogPostPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
