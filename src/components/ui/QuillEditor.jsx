import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
const ReactQuill = React.lazy(() => import('react-quill'));
import 'quill/dist/quill.snow.css';

// Enhanced Quill modules with comprehensive formatting options
export const quillModules = { 
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': ['sans-serif', 'serif', 'monospace'] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

function useDebouncedCallback(cb, delayMs) {
  const timeoutRef = useRef(null)
  const saved = useRef(cb)
  useEffect(() => { saved.current = cb }, [cb])
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => saved.current(...args), delayMs)
  }, [delayMs])
}

export default function QuillEditor({ value, onChange, placeholder, className = '', debounceMs = 250, ...props }) {
  const [shouldMount, setShouldMount] = useState(false)
  const containerRef = useRef(null)

  // Idle or on-focus mount to defer heavy editor cost
  useEffect(() => {
    let mounted = false
    const mount = () => { if (!mounted) { mounted = true; setShouldMount(true) } }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => mount(), { timeout: 1000 })
      return () => window.cancelIdleCallback && window.cancelIdleCallback(id)
    }
    const t = setTimeout(mount, 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onFocus = () => setShouldMount(true)
    el.addEventListener('pointerdown', onFocus, { once: true })
    return () => el.removeEventListener('pointerdown', onFocus)
  }, [])

  const stableModules = useMemo(() => quillModules, [])
  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs)

  return (
    <div ref={containerRef} className={`quill-wrapper ${className}`}>
      {shouldMount ? (
        <Suspense fallback={<div className="text-sm text-gray-400">Loading editor…</div>}>
          <ReactQuill
            theme="snow"
            value={value}
            onChange={debouncedOnChange}
            modules={stableModules}
            placeholder={placeholder}
            {...props}
          />
        </Suspense>
      ) : (
        <div className="min-h-[160px] rounded border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-3 py-2 text-sm text-gray-500">
          Click to edit…
        </div>
      )}
    </div>
  );
}
