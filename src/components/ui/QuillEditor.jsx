import React, { useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

// Suppress findDOMNode warning for ReactQuill
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('findDOMNode is deprecated')) {
    return; // Suppress this specific warning
  }
  originalConsoleWarn(...args);
};

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

export default function QuillEditor({ value, onChange, placeholder, className = '', ...props }) {
  // Restore console.warn on unmount
  useEffect(() => {
    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <div className={`quill-wrapper ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
