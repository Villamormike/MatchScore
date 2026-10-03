import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import './ResumeEditor.css'
import type { ScreenKey } from '../screenTypes'

const sections = ['Personal Info', 'Professional Summary', 'Work Experience', 'Skills Inventory', 'Education', 'Certifications']
const originalExperience = '• Developed modular UI components using React and TypeScript, resulting in a 25% improvement in load times.\n• Collaborative developer integrated directly with design teams to enforce standard component libraries and design tokens across platforms.'
const optimizedExperience = '• Developed modular, type-safe UI components using React and TypeScript, improving frontend load times by 25%.\n• Collaborated with design teams to standardize reusable component libraries and design tokens across platforms.'
type Props = { onNavigate: (screen: ScreenKey) => void; blank?: boolean }
type BlockSize = { width?: number; height?: number; left?: number; top?: number }
type BlankPageContent = { pageText: string; sections: string[]; freeformBlocks: string[]; freeformContent: Record<string, string>; blockSizes: Record<string, BlockSize>; imageUrl: string }
const createBlankPageContent = (): BlankPageContent => ({
  pageText: '',
  sections: [],
  freeformBlocks: [],
  freeformContent: {},
  blockSizes: {},
  imageUrl: '',
})

function ResumeEditor({ onNavigate, blank = false }: Props) {
  const [activeSection, setActiveSection] = useState('Work Experience')
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans')
  const [fontSize, setFontSize] = useState('11pt')
  const [textColor, setTextColor] = useState('#35445b')
  const [headingSize, setHeadingSize] = useState('11pt')
  const [imageTextGap, setImageTextGap] = useState(20)
  const [optimized, setOptimized] = useState(false)
  const [hiddenSections, setHiddenSections] = useState<string[]>([])
  const [experience, setExperience] = useState(originalExperience)
  const [customSections, setCustomSections] = useState<string[]>([])
  const [pages, setPages] = useState<number[]>([1])
  const [activePage, setActivePage] = useState(1)
  const [pageContent, setPageContent] = useState<Record<number, BlankPageContent>>({
    1: createBlankPageContent(),
  })
  const pageSizes = {
    A4: 680,
    Letter: 704,
    Long: 980,
  } as const
  const [pageSize, setPageSize] = useState<keyof typeof pageSizes>('A4')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pageEditorRef = useRef<HTMLDivElement>(null)
  const pageTextRef = useRef('')
  const loadedPageRef = useRef<number | null>(null)
  const resizeState = useRef<{ block: string; direction: string; startX: number; startY: number; width: number; height: number; left: number; top: number } | null>(null)
  const activePageContent = pageContent[activePage] ?? createBlankPageContent()
  const hasImage = Boolean(activePageContent.imageUrl)
  const pagePadding = 45
  const pageContentWidth = 600 - pagePadding * 2
  const positionedBlocks = [
    ...(hasImage ? ['Profile Photo'] : []),
    ...activePageContent.sections.filter((section) => section !== 'Profile Photo' && !hiddenSections.includes(section)),
    ...activePageContent.freeformBlocks,
  ].map((block, index) => {
    const size = activePageContent.blockSizes[block] ?? {}
    const isImage = block === 'Profile Photo'
    return {
      left: size.left ?? (isImage ? 375 : 24),
      top: size.top ?? (isImage ? 45 : 24 + index * 110),
      width: size.width ?? (isImage ? 180 : 320),
      height: size.height ?? (isImage ? 150 : 90),
    }
  })
  const topBlocks = positionedBlocks.filter((block) => block.top < 180)
  const leftOccupied = topBlocks
    .filter((block) => block.left < pagePadding + pageContentWidth / 2)
    .reduce((edge, block) => Math.max(edge, block.left + block.width - pagePadding), 0)
  const rightOccupied = topBlocks
    .filter((block) => block.left >= pagePadding + pageContentWidth / 2)
    .reduce((edge, block) => Math.max(edge, pagePadding + pageContentWidth - block.left), 0)
  const writingLeftGap = leftOccupied ? leftOccupied + imageTextGap : 0
  const writingRightGap = rightOccupied ? rightOccupied + imageTextGap : 0
  const contentMidpoint = pagePadding + pageContentWidth / 2
  const writingSurfaceStyle = {
    width: '100%',
    maxWidth: '100%',
    '--flow-left-width': `${writingLeftGap}px`,
    '--flow-left-height': `${leftOccupied ? Math.max(...topBlocks.filter((block) => block.left < contentMidpoint).map((block) => block.top + block.height)) : 0}px`,
    '--flow-right-width': `${writingRightGap}px`,
    '--flow-right-height': `${rightOccupied ? Math.max(...topBlocks.filter((block) => block.left >= contentMidpoint).map((block) => block.top + block.height)) : 0}px`,
    boxSizing: 'border-box',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  } as CSSProperties

  useEffect(() => {
    if (loadedPageRef.current === activePage || !pageEditorRef.current) return
    const pageText = pageContent[activePage]?.pageText ?? ''
    pageEditorRef.current.innerHTML = pageText
    pageTextRef.current = pageText
    pageEditorRef.current.focus()
    loadedPageRef.current = activePage
  }, [activePage, pageContent])

  const saveCurrentPageText = () => {
    if (!pageEditorRef.current) return
    const html = pageEditorRef.current.innerHTML
    pageTextRef.current = html
    setPageContent((current) => {
      const content = current[activePage] ?? createBlankPageContent()
      if (content.pageText === html) return current
      return { ...current, [activePage]: { ...content, pageText: html } }
    })
  }

  const toggleSection = (section: string) => {
    setHiddenSections((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section])
  }

  const toggleOptimization = () => {
    setExperience(optimized ? originalExperience : optimizedExperience)
    setOptimized(!optimized)
  }

  const addCustomSection = () => {
    const sectionNumber = customSections.length + 1
    const sectionName = `New Section ${sectionNumber}`
    setCustomSections((current) => [...current, sectionName])
    if (blank) {
      addBlankSection(sectionName)
    }
    setActiveSection(sectionName)
  }

  const addBlankSection = (section: string) => {
    saveCurrentPageText()
    setPageContent((current) => {
      const content = current[activePage] ?? createBlankPageContent()
      if (content.sections.includes(section)) return current
      return { ...current, [activePage]: { ...content, pageText: pageTextRef.current, sections: [...content.sections, section] } }
    })
    setActiveSection(section)
  }

  const addSectionBlock = (section: string) => {
    if (blank) {
      addBlankSection(section)
      return
    }
    setActiveSection(section)
  }

  const addFreeformBlock = (type: 'paragraph' | 'heading' | 'bullet' | 'divider' = 'paragraph') => {
    saveCurrentPageText()
    const labels = { paragraph: 'Text box', heading: 'Heading', bullet: 'Bullet list', divider: 'Divider' }
    const block = `${labels[type]} ${activePageContent.freeformBlocks.length + 1}`
    setPageContent((current) => {
      const content = current[activePage] ?? createBlankPageContent()
      return { ...current, [activePage]: { ...content, pageText: pageTextRef.current, freeformBlocks: [...content.freeformBlocks, block] } }
    })
    setActiveSection(block)
  }

  const formatSelectedText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const updateFreeformContent = (block: string, html: string) => {
    setPageContent((current) => {
      const content = current[activePage] ?? createBlankPageContent()
      return { ...current, [activePage]: { ...content, freeformContent: { ...content.freeformContent, [block]: html } } }
    })
  }

  const deleteSelectedBlock = () => {
    const selected = activeSection
    setPageContent((current) => {
      const content = current[activePage] ?? createBlankPageContent()
      if (!content.sections.includes(selected) && !content.freeformBlocks.includes(selected)) return current
      const freeformContent = { ...content.freeformContent }
      const blockSizes = { ...content.blockSizes }
      delete freeformContent[selected]
      delete blockSizes[selected]
      return { ...current, [activePage]: { ...content, sections: content.sections.filter((item) => item !== selected), freeformBlocks: content.freeformBlocks.filter((item) => item !== selected), freeformContent, blockSizes } }
    })
    setActiveSection('')
  }

  const startResize = (event: ReactPointerEvent, block: string, direction: string) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const element = event.currentTarget.parentElement
    if (!element) return
    const rect = element.getBoundingClientRect()
    const page = element.parentElement
    const pageWidth = page?.clientWidth ?? rect.width
    const pageHeight = page?.clientHeight ?? rect.height
    const savedPosition = activePageContent.blockSizes[block] ?? {}
    resizeState.current = { block, direction, startX: event.clientX, startY: event.clientY, width: rect.width, height: rect.height, left: savedPosition.left ?? element.offsetLeft, top: savedPosition.top ?? element.offsetTop }
    const handleMove = (moveEvent: PointerEvent) => {
      const state = resizeState.current
      if (!state) return
      const deltaX = moveEvent.clientX - state.startX
      const deltaY = moveEvent.clientY - state.startY
      const horizontal = state.direction.includes('e') ? deltaX : state.direction.includes('w') ? -deltaX : 0
      const vertical = state.direction.includes('s') ? deltaY : state.direction.includes('n') ? -deltaY : 0
      const nextWidth = Math.min(pageWidth, Math.max(120, state.width + horizontal))
      const nextHeight = Math.min(pageHeight, Math.max(45, state.height + vertical))
      const nextLeft = Math.min(pageWidth - nextWidth, Math.max(0, state.direction.includes('w') ? state.left + (state.width - nextWidth) : state.left))
      const nextTop = Math.min(pageHeight - nextHeight, Math.max(0, state.direction.includes('n') ? state.top + (state.height - nextHeight) : state.top))
      setPageContent((current) => {
        const content = current[activePage] ?? createBlankPageContent()
        return { ...current, [activePage]: { ...content, blockSizes: { ...content.blockSizes, [block]: { width: nextWidth, height: nextHeight, left: nextLeft, top: nextTop } } } }
      })
    }
    const stopResize = () => {
      resizeState.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stopResize)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stopResize)
  }

  const resizeHandles = (block: string) => ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'].map((direction) => <button className={`resize-handle resize-handle--${direction}`} type="button" key={direction} aria-label={`Resize ${block} ${direction}`} onPointerDown={(event) => startResize(event, block, direction)} />)

  const startMoveBlock = (event: ReactPointerEvent, block: string) => {
    if ((event.target as HTMLElement).closest('textarea, [contenteditable="true"], button, .resize-handle')) return
    event.preventDefault()
    event.stopPropagation()
    const element = event.currentTarget as HTMLElement
    const startX = event.clientX
    const startY = event.clientY
    const savedPosition = activePageContent.blockSizes[block] ?? {}
    const startLeft = savedPosition.left ?? element.offsetLeft
    const startTop = savedPosition.top ?? element.offsetTop
    const page = element.parentElement
    const maxLeft = Math.max(0, (page?.clientWidth ?? element.offsetWidth) - element.offsetWidth)
    const maxTop = Math.max(0, (page?.clientHeight ?? element.offsetHeight) - element.offsetHeight)
    const handleMove = (moveEvent: PointerEvent) => {
      setPageContent((current) => {
        const content = current[activePage] ?? createBlankPageContent()
        return { ...current, [activePage]: { ...content, blockSizes: { ...content.blockSizes, [block]: { ...content.blockSizes[block], left: Math.min(maxLeft, Math.max(0, startLeft + moveEvent.clientX - startX)), top: Math.min(maxTop, Math.max(0, startTop + moveEvent.clientY - startY)) } } } }
      })
    }
    const stopMove = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stopMove)
      window.removeEventListener('pointercancel', stopMove)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stopMove)
    window.addEventListener('pointercancel', stopMove)
  }

  const startMoveImage = (event: ReactPointerEvent) => {
    if (!activePageContent.imageUrl) return
    if ((event.target as HTMLElement).closest('.resize-handle, button')) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const imageElement = event.currentTarget as HTMLElement
    const savedPosition = activePageContent.blockSizes['Profile Photo'] ?? {}
    const position = { ...savedPosition, left: savedPosition.left ?? imageElement.offsetLeft, top: savedPosition.top ?? imageElement.offsetTop }
    const pageElement = imageElement.parentElement
    const imageWidth = imageElement.getBoundingClientRect().width
    const imageHeight = imageElement.getBoundingClientRect().height
    const pageRect = pageElement?.getBoundingClientRect()
    const pageWidth = pageRect?.width ?? imageWidth
    const pageHeight = pageRect?.height ?? imageHeight
    const pagePaddingLeft = pageElement ? Number.parseFloat(getComputedStyle(pageElement).paddingLeft) || 0 : 0
    const pagePaddingTop = pageElement ? Number.parseFloat(getComputedStyle(pageElement).paddingTop) || 0 : 0
    const handleMove = (moveEvent: PointerEvent) => {
      setPageContent((current) => {
        const content = current[activePage] ?? createBlankPageContent()
        const nextLeft = (position.left ?? 0) + moveEvent.clientX - startX
        const nextTop = (position.top ?? 0) + moveEvent.clientY - startY
        const maxLeft = Math.max(pagePaddingLeft, pageWidth - imageWidth - pagePaddingLeft)
        const maxTop = Math.max(pagePaddingTop, pageHeight - imageHeight - pagePaddingTop)
        return { ...current, [activePage]: { ...content, blockSizes: { ...content.blockSizes, 'Profile Photo': { ...position, left: Math.min(maxLeft, Math.max(pagePaddingLeft, nextLeft)), top: Math.min(maxTop, Math.max(pagePaddingTop, nextTop)) } } } }
      })
    }
    const stopMove = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stopMove)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stopMove)
    window.addEventListener('pointercancel', stopMove)
  }

  const addPage = () => {
    saveCurrentPageText()
    const nextPage = Math.max(...pages) + 1
    setPages((current) => [...current, nextPage])
    setPageContent((current) => ({ ...current, [nextPage]: createBlankPageContent() }))
    setActivePage(nextPage)
    setActiveSection('')
  }

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const nextImageUrl = URL.createObjectURL(file)
    const imageWidth = 180
    const pagePadding = 45
    setPageContent((current) => {
      const content = current[activePage] ?? createBlankPageContent()
      return { ...current, [activePage]: { ...content, imageUrl: nextImageUrl, sections: content.sections.includes('Profile Photo') ? content.sections : ['Profile Photo', ...content.sections], blockSizes: { ...content.blockSizes, 'Profile Photo': { width: imageWidth, height: 150, top: pagePadding } } } }
    })
    setActiveSection('Profile Photo')
  }

  return (
    <div className="resume-editor-page">
      <div className="editor-toolbar">
        <button className="editor-back" type="button" onClick={() => onNavigate('templates')} aria-label="Back to templates">‹</button>
        <strong>{blank ? 'Untitled_Resume.docx' : 'Alex_Mercer_JuniorDev_2026.docx'}</strong><span className="autosave-status"><i /> Autosaved to Cloud</span>
        <div className="editor-toolbar-actions"><button className="action-button action-outline" type="button" onClick={() => window.print()}>♧ &nbsp; Export PDF</button><button className="action-button action-primary" type="button" onClick={() => onNavigate('jobMatches')}>◉ &nbsp; Score Against Job</button></div>
      </div>
      <div className="editor-pages-bar" aria-label="Resume pages">
        <span>Pages</span>
        {pages.map((page) => <button className={activePage === page ? 'is-active' : ''} type="button" key={page} onClick={() => { saveCurrentPageText(); setActivePage(page) }}>Page {page}</button>)}
        <button className="add-page-button" type="button" onClick={addPage}>＋ Add page</button>
        {blank && <label className="page-size-control">Page size
          <select value={pageSize} onChange={(event) => setPageSize(event.target.value as keyof typeof pageSizes)} aria-label="Page size">
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Long">Long</option>
          </select>
        </label>}
        {blank && <span className="page-boundary-label">{pageSize} page boundary</span>}
      </div>
      <div className="editor-workspace">
        <aside className="editor-sections-panel">
          <h2>BUILDING BLOCKS <small>(OPTIONAL)</small></h2>
          {sections.map((section) => <div className={`editor-section-row ${activeSection === section ? 'is-active' : ''}`} key={section}><button type="button" onClick={() => addSectionBlock(section)}><span className="drag-handle">⠿</span>{section}</button><button className="add-block-button" type="button" onClick={() => addSectionBlock(section)} aria-label={`Add ${section} to canvas`}>＋</button><button className={`visibility-toggle ${hiddenSections.includes(section) ? 'is-hidden' : ''}`} type="button" aria-label={`${hiddenSections.includes(section) ? 'Show' : 'Hide'} ${section}`} onClick={() => toggleSection(section)}>{hiddenSections.includes(section) ? '◌' : '◉'}</button></div>)}
          {customSections.map((section) => <div className={`editor-section-row ${activeSection === section ? 'is-active' : ''}`} key={section}><button type="button" onClick={() => setActiveSection(section)}><span className="drag-handle">⠿</span>{section}</button><button className="add-block-button" type="button" onClick={() => addSectionBlock(section)} aria-label={`Add ${section} to canvas`}>＋</button><button className={`visibility-toggle ${hiddenSections.includes(section) ? 'is-hidden' : ''}`} type="button" aria-label={`${hiddenSections.includes(section) ? 'Show' : 'Hide'} ${section}`} onClick={() => toggleSection(section)}>{hiddenSections.includes(section) ? '◌' : '◉'}</button></div>)}
          <button className="add-section-button" type="button" onClick={blank ? addCustomSection : () => setActiveSection('Certifications')}>＋ &nbsp; Add New Section</button>
          {blank && <p className="canvas-help">Choose a page size above or add another page. Resize blocks from the lower-right corner.</p>}
          {blank && <div className="freeform-block-tools" aria-label="Add freeform blocks">
            <strong>FREEFORM BLOCKS</strong>
            <button className="add-text-button" type="button" onClick={() => addFreeformBlock('paragraph')}>¶ &nbsp; Paragraph</button>
            <button className="add-text-button" type="button" onClick={() => addFreeformBlock('heading')}>H &nbsp; Heading</button>
            <button className="add-text-button" type="button" onClick={() => addFreeformBlock('bullet')}>• &nbsp; Bullet list</button>
            <button className="add-text-button" type="button" onClick={() => addFreeformBlock('divider')}>— &nbsp; Divider</button>
          </div>}
          {blank && <><input ref={imageInputRef} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} /><button className="add-image-button" type="button" onClick={() => imageInputRef.current?.click()}>▣ &nbsp; Add profile photo</button></>}
        </aside>
        <section className="resume-canvas" aria-label="Resume preview">
          <article className={`resume-paper ${blank ? 'resume-paper--blank' : ''}`} style={{ '--page-height': `${pageSizes[pageSize]}px`, fontFamily: fontFamily === 'Plus Jakarta Sans' ? 'inherit' : fontFamily, fontSize, color: textColor } as CSSProperties}>
            {blank && <div className="freeform-page-editor" style={writingSurfaceStyle} contentEditable suppressContentEditableWarning role="textbox" aria-label={`Write on page ${activePage}`} data-placeholder="Start typing anywhere..." ref={pageEditorRef} onInput={(event) => { pageTextRef.current = event.currentTarget.innerHTML }} onBlur={saveCurrentPageText} />}
            {blank && activePageContent.sections.filter((section) => !hiddenSections.includes(section)).map((section, index) => <section className={`paper-section custom-paper-section ${activeSection === section ? 'paper-section-active' : ''} ${section === 'Profile Photo' ? 'photo-paper-section' : ''}`} style={{ ...activePageContent.blockSizes[section], position: 'absolute', ...(section === 'Profile Photo' && !activePageContent.blockSizes[section]?.left ? { left: 'auto', right: 45 } : { left: activePageContent.blockSizes[section]?.left ?? 24 }), top: activePageContent.blockSizes[section]?.top ?? (section === 'Profile Photo' ? 45 : 24 + index * 110), ...(activeSection === section ? { color: textColor, fontSize: headingSize } : {}) }} draggable={false} key={section} onPointerDown={section === 'Profile Photo' ? startMoveImage : (event) => startMoveBlock(event, section)} onClick={() => setActiveSection(section)}>{section === 'Profile Photo' ? <>{activePageContent.imageUrl ? <img className="resume-profile-photo" src={activePageContent.imageUrl} alt="Uploaded profile" /> : <button className="photo-placeholder" type="button" onClick={() => imageInputRef.current?.click()}>＋ Add photo</button>}</> : <><div className="paper-section-title"><h2>{section}</h2>{activeSection === section && <span>EDITING · DRAG TO MOVE</span>}</div><textarea onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} aria-label={`Edit ${section}`} placeholder={`Add your ${section.toLowerCase()} here...`} /></>}{activeSection === section && resizeHandles(section)}</section>)}
            {blank && activePageContent.freeformBlocks.map((block, index) => {
              const type = block.startsWith('Heading') ? 'heading' : block.startsWith('Bullet list') ? 'bullet' : block.startsWith('Divider') ? 'divider' : 'paragraph'
              return (
                <div className={`freeform-text-block freeform-text-block--${type} ${activeSection === block ? 'paper-section-active' : ''}`} style={{ ...activePageContent.blockSizes[block], position: 'absolute', left: activePageContent.blockSizes[block]?.left ?? 24, top: activePageContent.blockSizes[block]?.top ?? 24 + index * 110 }} key={block} onPointerDown={(event) => startMoveBlock(event, block)} onClick={() => setActiveSection(block)}>
                  {type === 'divider' ? <hr /> : <div className="freeform-text-editor" contentEditable suppressContentEditableWarning role="textbox" aria-label={block} data-placeholder={type === 'heading' ? 'Type a heading...' : type === 'bullet' ? 'Type a list item...' : 'Type anything here...'} dangerouslySetInnerHTML={{ __html: activePageContent.freeformContent[block] ?? '' }} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onInput={(event) => updateFreeformContent(block, event.currentTarget.innerHTML)} ref={(element) => { if (index === 0 && activePage === 1 && !activePageContent.freeformContent[block]) element?.focus() }} />}
                  {activeSection === block && resizeHandles(block)}
                </div>
              )
            })}
            {!blank && !hiddenSections.includes('Personal Info') && <header className={`paper-personal ${activeSection === 'Personal Info' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Personal Info')}><h1>ALEX MERCER</h1><p>Seattle, WA • (555) 019-2831 • alex.mercer@email.com • github.com/alexmercer</p></header>}
            {!blank && !hiddenSections.includes('Professional Summary') && <section className={`paper-section ${activeSection === 'Professional Summary' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Professional Summary')}><h2>PROFESSIONAL SUMMARY</h2><p>Detail-oriented Junior Web Developer with a strong foundation in modern frontend architectures. Experienced in building responsive interfaces with React, TypeScript, and Tailwind CSS. Passionate about optimization and clean, semantic markup.</p></section>}
            {!blank && !hiddenSections.includes('Work Experience') && <section className={`paper-section ${activeSection === 'Work Experience' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Work Experience')}><div className="paper-section-title"><h2>WORK EXPERIENCE</h2>{activeSection === 'Work Experience' && <span>EDITING</span>}</div><div className="paper-job-line"><strong>Junior Web Developer — Apex Tech Solutions</strong><span>2024 – Present</span></div><textarea aria-label="Edit work experience" value={experience} onChange={(event) => setExperience(event.target.value)} /></section>}
            {!blank && !hiddenSections.includes('Skills Inventory') && <section className={`paper-section ${activeSection === 'Skills Inventory' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Skills Inventory')}><h2>SKILLS INVENTORY</h2><p><strong>Languages:</strong> JavaScript, TypeScript, HTML5, CSS3, SQL<br /><strong>Frameworks:</strong> React, Next.js, Tailwind CSS, Node.js, Express</p></section>}
            {!blank && !hiddenSections.includes('Education') && <section className={`paper-section paper-compact ${activeSection === 'Education' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Education')}><h2>EDUCATION</h2><p><strong>B.S. Computer Science</strong> — University of Washington, 2024</p></section>}
            {!blank && !hiddenSections.includes('Certifications') && <section className={`paper-section paper-compact ${activeSection === 'Certifications' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Certifications')}><h2>CERTIFICATIONS</h2><p>Responsive Web Design — freeCodeCamp</p></section>}
            {!blank && customSections.map((section) => <section className={`paper-section custom-paper-section ${activeSection === section ? 'paper-section-active' : ''}`} key={section} onClick={() => setActiveSection(section)}><div className="paper-section-title"><h2>{section}</h2>{activeSection === section && <span>EDITING</span>}</div><textarea aria-label={`Edit ${section}`} placeholder={`Add your ${section.toLowerCase()} here...`} /></section>)}
          </article>
        </section>
        <aside className="editor-format-panel">
          <h2>FORMATTING</h2>
          <label>Font Family<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}><option>Plus Jakarta Sans</option><option>Arial</option><option>Georgia</option></select></label>
          <div className="format-controls"><label>Base Size<select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option>10pt</option><option>11pt</option><option>12pt</option><option>14pt</option></select></label><label>Image gap<select value={imageTextGap} onChange={(event) => setImageTextGap(Number(event.target.value))}><option value={8}>8px</option><option value={16}>16px</option><option value={20}>20px</option><option value={28}>28px</option><option value={40}>40px</option><option value={56}>56px</option></select></label></div>
          <div className="format-controls typography-controls"><label>Text Color<span className="color-control"><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); formatSelectedText('foreColor', event.target.value) }} /><code>{textColor.toUpperCase()}</code></span></label><label>Font Size<select value={headingSize} onChange={(event) => { setHeadingSize(event.target.value); formatSelectedText('fontSize', event.target.value === '10pt' ? '2' : event.target.value === '11pt' ? '3' : event.target.value === '12pt' ? '4' : event.target.value === '14pt' ? '5' : event.target.value === '16pt' ? '6' : '7') }}><option>10pt</option><option>11pt</option><option>12pt</option><option>14pt</option><option>16pt</option><option>18pt</option></select></label></div>
          {blank && <div className="text-format-toolbar" aria-label="Text formatting"><button type="button" className="text-format-button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelectedText('bold')}><strong>B</strong> Bold</button><span>Select text in a freeform box to format it.</span></div>}
          {blank && (activePageContent.sections.includes(activeSection) || activePageContent.freeformBlocks.includes(activeSection)) && <button className="delete-block-button" type="button" onClick={deleteSelectedBlock}>Delete selected block</button>}
          <div className="editor-ai-card"><h3>✧ AI Recommendation</h3><p>{optimized ? 'Your experience now highlights TypeScript and measurable impact for this role.' : 'We detected “APEX Solutions” contains zero active match keywords overlap against standard web development jobs. Consider adding tags like “REST APIs” or “State Management”.'}</p><button type="button" onClick={toggleOptimization}>{optimized ? 'Undo suggestion' : 'Auto-optimize line'}</button></div>
        </aside>
      </div>
    </div>
  )
}

export default ResumeEditor
