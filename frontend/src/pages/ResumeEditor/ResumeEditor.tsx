import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react'
import './ResumeEditor.css'
import type { ScreenKey, UploadedDocument } from '../screenTypes'
import type { SavedDocument } from '../screenTypes'
import { saveAccountDocument } from '../../lib/accountStorage'
import { apiUrl } from '../../api'

type Props = {
  initialDocument?: SavedDocument | null
  initialContent?: UploadedDocument | null
  onNavigate: (screen: ScreenKey) => void
  onDocumentUploaded: (document: SavedDocument) => void
}

const commands = [
  { label: 'B', command: 'bold', title: 'Bold' },
  { label: 'I', command: 'italic', title: 'Italic' },
  { label: 'U', command: 'underline', title: 'Underline' },
  { label: 'S', command: 'strikeThrough', title: 'Strikethrough' },
] as const

function ResumeEditor({ initialDocument, initialContent, onNavigate, onDocumentUploaded }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const selectedImageRef = useRef<HTMLImageElement | null>(null)
  const [documentName, setDocumentName] = useState(initialDocument?.name || (initialContent ? 'AI Generated Resume' : 'Untitled document'))
  const [saved, setSaved] = useState(true)
  const [uploadError, setUploadError] = useState('')
  const [hasSelectedImage, setHasSelectedImage] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | undefined>(initialDocument?.id)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const content = initialDocument || initialContent
    if (!content || !editorRef.current) return
    if (content.html) {
      editorRef.current.innerHTML = content.html
    } else {
      editorRef.current.textContent = content.text
    }
  }, [initialDocument, initialContent])

  const saveDocument = async (document: UploadedDocument, name = documentName) => {
    setSaveError('')
    setSaved(false)
    try {
      const savedDocument = await saveAccountDocument(document, name, documentId)
      setDocumentId(savedDocument.id)
      onDocumentUploaded(savedDocument)
      setSaved(true)
    } catch (error) {
      console.error('Unable to save document', error)
      setSaveError('Could not save this document to your account.')
    }
  }

  const saveEditorContent = () => {
    const editor = editorRef.current
    if (!editor || !editor.innerText.trim()) return
    const text = editor.innerText
    void saveDocument({
      filename: documentName,
      format: 'HTML',
      text,
      html: editor.innerHTML,
      sections: {},
      word_count: text.split(/\s+/).filter(Boolean).length,
      char_count: text.length,
      summary_preview: text.slice(0, 150),
      skills_preview: '',
    })
  }

  const execute = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    setSaved(false)
  }

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => execute('insertImage', String(reader.result))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const updateImage = (property: 'width' | 'height' | 'float', value: string) => {
    const selectedImage = selectedImageRef.current
    if (!selectedImage) return
    if (property === 'float') {
      selectedImage.style.float = value === 'none' ? '' : value
      selectedImage.style.display = value === 'none' ? 'block' : 'inline'
      selectedImage.style.margin = value === 'none' ? '10px 0' : '10px'
    } else {
      selectedImage.style[property] = value
      if (property === 'width') selectedImage.style.height = 'auto'
    }
    setSaved(false)
  }

  const deleteSelectedImage = () => {
    selectedImageRef.current?.remove()
    selectedImageRef.current = null
    setHasSelectedImage(false)
    setSaved(false)
  }

  const menuAction = (action: () => void) => {
    action()
    setOpenMenu(null)
  }

  const handleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(apiUrl('/api/upload-resume'), {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.data?.text) {
        throw new Error(result.error || 'The file could not be imported.')
      }

      importDocumentIntoEditor(result.data)
      if (editorRef.current && result.data.page_style) {
        Object.entries(result.data.page_style).forEach(([property, value]) => {
          editorRef.current?.style.setProperty(property.replace(/[A-Z]/g, (letter: string) => `-${letter.toLowerCase()}`), String(value))
        })
      }
      setDocumentName(file.name.replace(/\.[^/.]+$/, ''))
      void saveDocument({ ...result.data, sourceFile: file }, file.name.replace(/\.[^/.]+$/, ''))
    } catch (error) {
      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = () => {
          const text = String(reader.result || '')
          const fallbackDocument: UploadedDocument = {
            filename: file.name,
            format: 'TXT',
            text,
            sourceFile: file,
            sections: { raw: text },
            word_count: text.split(/\s+/).filter(Boolean).length,
            char_count: text.length,
            summary_preview: text.slice(0, 150),
            skills_preview: '',
          }
          importDocumentIntoEditor(fallbackDocument)
          setDocumentName(file.name.replace(/\.[^/.]+$/, ''))
          void saveDocument(fallbackDocument, file.name.replace(/\.[^/.]+$/, ''))
        }
        reader.onerror = () => setUploadError('The text file could not be read.')
        reader.readAsText(file)
        return
      }
      setUploadError('Could not reach the document parser. Start the backend to import PDF or DOCX files.')
    }
  }

  const importDocumentIntoEditor = (document: UploadedDocument) => {
    if (!editorRef.current) return
    if (document.html) {
      editorRef.current.innerHTML = document.html
    } else {
      editorRef.current.textContent = document.text
    }
    editorRef.current.focus()
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData('text/html')
    const text = event.clipboardData.getData('text/plain')
    if (!text) return
    event.preventDefault()
    if (html) {
      document.execCommand('insertHTML', false, html)
    } else {
      document.execCommand('insertText', false, text)
    }
    setSaved(false)
  }

  return (
    <div className="resume-editor-page">
      <div className="editor-toolbar">
        <button className="editor-back" type="button" onClick={() => onNavigate('templates')} aria-label="Back to templates">‹</button>
        <input className="document-title" aria-label="Document name" value={documentName} onChange={(event) => { setDocumentName(event.target.value); setSaved(false) }} />
        <span className="autosave-status"><i /> {saved ? 'Saved to Cloud' : 'Unsaved changes'}</span>
        <div className="editor-toolbar-actions">
          <button className="action-button action-outline" type="button" onClick={() => documentInputRef.current?.click()}>Upload file</button>
          <input ref={documentInputRef} className="hidden-file-input" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleDocumentUpload} />
          <button className="action-button action-outline" type="button" onClick={() => window.print()}>Export PDF</button>
          <button className="action-button action-primary" type="button" onClick={() => onNavigate('jobMatches')}>Score Against Job</button>
        </div>
      </div>
      {uploadError && <p className="editor-upload-error" role="alert">{uploadError} Make sure the backend is running on port 5000.</p>}
      {saveError && <p className="editor-upload-error" role="alert">{saveError}</p>}

      <div className="document-menu-bar" aria-label="Document menus">
        <div className="document-menu">
          <button type="button" aria-expanded={openMenu === 'file'} onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}>File</button>
          {openMenu === 'file' && <div className="document-menu-dropdown">
            <button type="button" onClick={() => menuAction(() => editorRef.current?.focus())}>New document</button>
            <button type="button" onClick={() => menuAction(() => documentInputRef.current?.click())}>Open / Upload file</button>
            <button type="button" onClick={() => menuAction(() => window.print())}>Download / Export PDF</button>
          </div>}
        </div>
        <div className="document-menu">
          <button type="button" aria-expanded={openMenu === 'edit'} onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}>Edit</button>
          {openMenu === 'edit' && <div className="document-menu-dropdown">
            <button type="button" onClick={() => menuAction(() => execute('undo'))}>Undo</button>
            <button type="button" onClick={() => menuAction(() => execute('redo'))}>Redo</button>
            <button type="button" onClick={() => menuAction(() => execute('selectAll'))}>Select all</button>
          </div>}
        </div>
        <div className="document-menu">
          <button type="button" aria-expanded={openMenu === 'view'} onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}>View</button>
          {openMenu === 'view' && <div className="document-menu-dropdown">
            <button type="button" onClick={() => menuAction(() => editorRef.current?.focus())}>Focus document</button>
            <button type="button" onClick={() => menuAction(() => window.print())}>Print preview</button>
          </div>}
        </div>
        <div className="document-menu">
          <button type="button" aria-expanded={openMenu === 'insert'} onClick={() => setOpenMenu(openMenu === 'insert' ? null : 'insert')}>Insert</button>
          {openMenu === 'insert' && <div className="document-menu-dropdown">
            <button type="button" onClick={() => menuAction(() => imageInputRef.current?.click())}>Image</button>
            <button type="button" onClick={() => menuAction(() => { const url = window.prompt('Enter a URL'); if (url) execute('createLink', url) })}>Link</button>
            <button type="button" onClick={() => menuAction(() => execute('insertHTML', '<hr>'))}>Horizontal line</button>
          </div>}
        </div>
        <div className="document-menu">
          <button type="button" aria-expanded={openMenu === 'format'} onClick={() => setOpenMenu(openMenu === 'format' ? null : 'format')}>Format</button>
          {openMenu === 'format' && <div className="document-menu-dropdown">
            <button type="button" onClick={() => menuAction(() => execute('bold'))}>Bold</button>
            <button type="button" onClick={() => menuAction(() => execute('italic'))}>Italic</button>
            <button type="button" onClick={() => menuAction(() => execute('underline'))}>Underline</button>
            <button type="button" onClick={() => menuAction(() => execute('removeFormat'))}>Clear formatting</button>
          </div>}
        </div>
        <div className="document-menu">
          <button type="button" aria-expanded={openMenu === 'tools'} onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}>Tools</button>
          {openMenu === 'tools' && <div className="document-menu-dropdown">
            <button type="button" onClick={() => menuAction(() => editorRef.current?.focus())}>Spelling</button>
            <button type="button" onClick={() => menuAction(() => setSaved(true))}>Mark as saved</button>
          </div>}
        </div>
      </div>

      <div className="document-format-bar" aria-label="Formatting toolbar">
        <button type="button" title="Undo" onClick={() => execute('undo')}>↶</button>
        <button type="button" title="Redo" onClick={() => execute('redo')}>↷</button>
        <span className="toolbar-divider" />
        <select aria-label="Text style" defaultValue="p" onChange={(event) => execute('formatBlock', event.target.value)}>
          <option value="p">Normal text</option><option value="h1">Title</option><option value="h2">Heading 1</option><option value="h3">Heading 2</option>
        </select>
        <select aria-label="Font family" defaultValue="Arial" onChange={(event) => execute('fontName', event.target.value)}>
          <option>Arial</option><option>Calibri</option><option>Georgia</option><option>Times New Roman</option><option>Verdana</option>
        </select>
        <select aria-label="Font size" defaultValue="3" onChange={(event) => execute('fontSize', event.target.value)}>
          <option value="1">8</option><option value="2">10</option><option value="3">12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">32</option>
        </select>
        <span className="toolbar-divider" />
        {commands.map((item) => <button className={`format-command format-command--${item.command}`} key={item.command} type="button" title={item.title} onClick={() => execute(item.command)}>{item.label}</button>)}
        <label className="color-control" title="Text color">A<input type="color" defaultValue="#202124" onChange={(event) => execute('foreColor', event.target.value)} /></label>
        <label className="color-control color-control--highlight" title="Highlight color">▰<input type="color" defaultValue="#fff59d" onChange={(event) => execute('hiliteColor', event.target.value)} /></label>
        <span className="toolbar-divider" />
        <button type="button" title="Align left" onClick={() => execute('justifyLeft')}>≡</button>
        <button type="button" title="Align center" onClick={() => execute('justifyCenter')}>≣</button>
        <button type="button" title="Align right" onClick={() => execute('justifyRight')}>≡</button>
        <button type="button" title="Bulleted list" onClick={() => execute('insertUnorderedList')}>•≡</button>
        <button type="button" title="Numbered list" onClick={() => execute('insertOrderedList')}>1≡</button>
        <button type="button" title="Decrease indent" onClick={() => execute('outdent')}>⇤</button>
        <button type="button" title="Increase indent" onClick={() => execute('indent')}>⇥</button>
        <select aria-label="Line spacing" defaultValue="1.5" onChange={(event) => execute('formatBlock', `<div style="line-height:${event.target.value}">`)}>
          <option value="1">Single</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">Double</option>
        </select>
        <button type="button" title="Insert link" onClick={() => { const url = window.prompt('Enter a URL'); if (url) execute('createLink', url) }}>⌁</button>
        <button type="button" title="Insert image" onClick={() => imageInputRef.current?.click()}>▧</button>
        <input ref={imageInputRef} className="hidden-file-input" type="file" accept="image/*" onChange={handleImage} />
        {hasSelectedImage && <>
          <span className="toolbar-divider" />
          <span className="image-toolbar-label">Image</span>
          <select aria-label="Image width" defaultValue="auto" onChange={(event) => updateImage('width', event.target.value)}>
            <option value="auto">Auto</option><option value="25%">25%</option><option value="50%">50%</option><option value="75%">75%</option><option value="100%">100%</option>
          </select>
          <button type="button" title="Align image left" onClick={() => updateImage('float', 'left')}>◧</button>
          <button type="button" title="Center image" onClick={() => updateImage('float', 'none')}>▣</button>
          <button type="button" title="Align image right" onClick={() => updateImage('float', 'right')}>◨</button>
          <button type="button" className="delete-image-button" title="Delete image" onClick={deleteSelectedImage}>⌫</button>
        </>}
      </div>

      <main className="document-workspace">
        <div className="document-ruler" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span></div>
        <article
          ref={editorRef}
          className="document-page"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          data-placeholder="Start typing your document..."
          onInput={() => setSaved(false)}
          onPaste={handlePaste}
          onBlur={saveEditorContent}
          onClick={(event) => {
            const target = event.target
            selectedImageRef.current?.classList.remove('is-selected')
            if (target instanceof HTMLImageElement) {
              target.classList.add('is-selected')
              selectedImageRef.current = target
              setHasSelectedImage(true)
            } else {
              selectedImageRef.current = null
              setHasSelectedImage(false)
            }
          }}
          aria-label="Document editor"
        />
      </main>
    </div>
  )
}

export default ResumeEditor
