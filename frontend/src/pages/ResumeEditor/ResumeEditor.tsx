import { useRef, useState, type ChangeEvent } from 'react'
import './ResumeEditor.css'
import type { ScreenKey, UploadedDocument } from '../screenTypes'

type Props = {
  onNavigate: (screen: ScreenKey) => void
  onDocumentUploaded: (document: UploadedDocument) => void
}

const commands = [
  { label: 'B', command: 'bold', title: 'Bold' },
  { label: 'I', command: 'italic', title: 'Italic' },
  { label: 'U', command: 'underline', title: 'Underline' },
  { label: 'S', command: 'strikeThrough', title: 'Strikethrough' },
] as const

function ResumeEditor({ onNavigate, onDocumentUploaded }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [documentName, setDocumentName] = useState('Untitled document')
  const [saved, setSaved] = useState(true)
  const [uploadError, setUploadError] = useState('')

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

  const handleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.data?.text) {
        throw new Error(result.error || 'The file could not be imported.')
      }

      if (editorRef.current) {
        const lines = result.data.text.split(/\r?\n/)
        editorRef.current.innerHTML = lines
          .map((line: string) => line.trim() ? `<div>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : '<div><br></div>')
          .join('')
        editorRef.current.focus()
      }
      onDocumentUploaded(result.data)
      setDocumentName(file.name.replace(/\.[^/.]+$/, ''))
      setSaved(false)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The file could not be imported.')
    }
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

      <div className="document-menu-bar" aria-label="Document menus">
        <button type="button">File</button><button type="button">Edit</button><button type="button">View</button><button type="button">Insert</button><button type="button">Format</button><button type="button">Tools</button>
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
          onBlur={() => setSaved(false)}
          aria-label="Document editor"
        />
      </main>
    </div>
  )
}

export default ResumeEditor
