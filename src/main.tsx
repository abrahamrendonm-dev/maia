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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:channel" element={<BlogChannelPage />} />
        <Route path="/blog/:channel/:slug" element={<BlogPostPage />} />
        <Route
          path="/blog-editor"
          element={
            <RequireEditor>
              <BlogEditorList />
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
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
