import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

function Icon({ name, size = 20 }) {
  const paths = {
    spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    upload: <><path d="M12 16V3"/><path d="m7 8 5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.4"/><path d="m21 15-4.7-4.7L6 20"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    shield: <><path d="M12 22s8-3.4 8-10V5l-8-3-8 3v7c0 6.6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatBytes(bytes) {
  if (!bytes) return ''
  return `${(bytes / 1024 / 1024).toFixed(bytes > 1024 * 1024 ? 1 : 2)} MB`
}

export default function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [analysisMode, setAnalysisMode] = useState('general')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function setSelectedFile(next) {
    if (!next) return
    if (!acceptedTypes.includes(next.type)) { setError('Choose a JPG, PNG, or WebP image.'); return }
    if (next.size > 10 * 1024 * 1024) { setError('Image must be 10 MB or smaller.'); return }
    setFile(next); setResult(null); setError(''); setCopied(false)
  }

  function chooseFile(event) { setSelectedFile(event.target.files?.[0]) }
  function removeFile() { setFile(null); setResult(null); setError(''); setCopied(false); if (inputRef.current) inputRef.current.value = '' }

  async function analyze() {
    if (!file) return
    setLoading(true); setError(''); setResult(null); setCopied(false)
    const form = new FormData(); form.append('image', file); form.append('analysis_mode', analysisMode)
    try {
      const response = await fetch(`${API_URL}/classify`, { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? 'Analysis failed. Please try again.')
      setResult(data)
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  async function copyAnalysis() {
    if (!result) return
    const partText = result.parts?.length ? `\n\nIdentified parts:\n${result.parts.map((part) => `- ${part.name} (${part.category}, ${part.location}; ${part.confidence} confidence)`).join('\n')}` : ''
    const text = `${result.summary}\n\nVisible subjects: ${result.objects.join(', ')}\nScene: ${result.scene}${partText}\n\n${result.confidence_note}`
    await navigator.clipboard?.writeText(text)
    setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  return <div className="app-shell">
    <nav className="topbar">
      <a className="brand" href="#top" aria-label="Looksee home"><span className="brand-mark"><Icon name="spark" size={17}/></span><span>looksee</span></a>
      <div className="nav-links"><a href="#analyze">Analyze</a><a href="#how-it-works">How it works</a><a href="#use-cases">Use cases</a><a href="#faq">FAQ</a><a href="#about">About</a></div>
      <button className="nav-cta" onClick={() => document.querySelector('#analyze')?.scrollIntoView({ behavior: 'smooth' })}>Try it free <Icon name="arrow" size={16}/></button>
    </nav>

    <main id="top">
      <section className="hero product-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span></span> VISUAL UNDERSTANDING, MADE SIMPLE</p>
          <h1>Know what you’re<br/><em>looking at.</em></h1>
          <p className="hero-text">Upload a photo of an engine, circuit board, appliance, tool, or anything else. Looksee explains the scene and clearly names the parts it can see.</p>
          <div className="hero-buttons"><button className="primary-button" onClick={() => document.querySelector('#analyze')?.scrollIntoView({ behavior: 'smooth' })}>Analyze an image <Icon name="arrow" size={17}/></button><a className="hero-secondary" href="#how-it-works">See how it works <Icon name="arrow" size={16}/></a></div>
          <div className="trust"><Icon name="shield" size={17}/><span>No sign-up required. Images are analysed for your request and not publicly shared.</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true"><div className="visual-card visual-card-main"><span className="visual-label">ENGINE BAY</span><div className="wireframe-engine"><i></i><i></i><i></i><i></i><b></b></div><span className="visual-scan"></span></div><div className="visual-card visual-card-tag"><span className="tag-dot"></span><strong>Air filter housing</strong><small>high confidence</small></div><div className="visual-card visual-card-stat"><Icon name="spark" size={17}/><span>VISIBLE PARTS</span><strong>06</strong></div></div>
      </section>

      <section className="value-grid" aria-label="Looksee capabilities"><article><Icon name="image" size={25}/><h2>General analysis</h2><p>A brief, plain-language explanation of visible objects and the scene — no jargon or filler.</p></article><article><Icon name="spark" size={25}/><h2>Identify parts</h2><p>Names visible engine, vehicle, tool, appliance, and other components with helpful context.</p></article><article><Icon name="info" size={25}/><h2>Honest confidence</h2><p>Every component is tagged high, medium, or low so you know what to re-check.</p></article><article><Icon name="shield" size={25}/><h2>Private by default</h2><p>No account needed. Upload a photo, get an answer, and move on.</p></article></section>

      <section id="analyze" className={`analysis-area ${result ? 'has-result' : ''}`} aria-label="Image analysis">
        <div className="panel-top"><div><p className="panel-kicker">YOUR IMAGE</p><h2>{result ? 'Analysis ready' : 'Start with an image'}</h2></div>{file && <p className="file-meta">{file.name} <span>·</span> {formatBytes(file.size)}</p>}</div>

        {!result && <>
          <div className="mode-picker" role="group" aria-label="Choose analysis type">
            <button type="button" className={analysisMode === 'general' ? 'active' : ''} onClick={() => setAnalysisMode('general')}><Icon name="image" size={17}/><span><strong>General analysis</strong><small>Objects, scene and summary</small></span></button>
            <button type="button" className={analysisMode === 'components' ? 'active' : ''} onClick={() => setAnalysisMode('components')}><Icon name="spark" size={17}/><span><strong>Identify parts</strong><small>Engine, vehicle and visible components</small></span></button>
          </div>
          {analysisMode === 'components' && <p className="mode-hint"><Icon name="info" size={15}/> For the clearest labels, upload a bright close-up where the engine or component is visible.</p>}
          <label className={`dropzone ${preview ? 'has-preview' : ''} ${dragging ? 'dragging' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); setSelectedFile(event.dataTransfer.files?.[0]) }}>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile}/>
            {preview ? <>
              <img src={preview} alt="Selected upload preview"/>
              <button type="button" className="remove-image" onClick={(event) => { event.preventDefault(); removeFile() }} aria-label="Remove image"><Icon name="close" size={18}/></button>
              <div className="preview-caption"><span>Ready for analysis</span><strong>Click Analyze image below</strong></div>
            </> : <div className="upload-empty"><span className="upload-icon"><Icon name="upload" size={26}/></span><strong>Drop an image here</strong><p>or <u>browse from your device</u></p><small>JPG, PNG or WebP · up to 10 MB</small></div>}
          </label>
          <div className="action-row"><button className="primary-button" onClick={analyze} disabled={!file || loading}>{loading ? <><span className="loader"></span> {analysisMode === 'components' ? 'Identifying parts…' : 'Looking at your image…'}</> : <><Icon name="spark" size={18}/>{analysisMode === 'components' ? 'Identify parts' : 'Analyze image'}</>}</button>{file && <button className="text-button" onClick={removeFile}>Choose another <Icon name="arrow" size={16}/></button>}</div>
          {loading && <div className="loading-card"><span className="pulse-dot"></span><div><strong>{analysisMode === 'components' ? 'Naming visible components' : 'Understanding your image'}</strong><p>{analysisMode === 'components' ? 'Checking visible engine, vehicle and other parts.' : 'Identifying visible subjects, scene and details.'}</p></div></div>}
        </>}

        {error && <div className="error-card" role="alert"><div><strong>Couldn’t complete the analysis</strong><p>{error}</p></div><button onClick={analyze} disabled={!file || loading}>Try again</button></div>}

        {result && <div className="result-layout">
          <div className="result-image"><img src={preview} alt="Analyzed upload"/><button type="button" className="change-overlay" onClick={removeFile}><Icon name="upload" size={16}/> Analyze another</button></div>
          <article className="result-card">
            <p className="eyebrow"><span></span> AI ANALYSIS</p>
            <h2>{result.summary}</h2>
            <div className="result-section"><h3>Visible subjects</h3><div className="tags">{result.objects.length ? result.objects.map((item) => <span key={item}>{item}</span>) : <span>None identified</span>}</div></div>
            <div className="result-section scene"><h3>Scene</h3><p>{result.scene}</p></div>
            {result.parts?.length > 0 && <div className="result-section parts-section"><div className="parts-heading"><h3>Identified parts & components</h3><span>{result.parts.length} found</span></div><div className="parts-list">{result.parts.map((part, index) => <article className="part-card" key={`${part.name}-${index}`}><div className="part-number">{String(index + 1).padStart(2, '0')}</div><div><div className="part-title"><strong>{part.name}</strong><span className={`confidence-pill ${part.confidence?.toLowerCase()}`}>{part.confidence}</span></div><p>{part.category} · {part.location}</p><small>{part.description}</small></div></article>)}</div></div>}
            <div className="confidence"><Icon name="info" size={18}/><p>{result.confidence_note}</p></div>
            {result.safety_note && <p className="safety-note">{result.safety_note}</p>}
            <div className="result-actions"><button className="primary-button small" onClick={removeFile}>Analyze another <Icon name="arrow" size={16}/></button><button className="icon-button" onClick={copyAnalysis} aria-label="Copy analysis"><Icon name="copy" size={18}/>{copied ? 'Copied' : 'Copy'}</button></div>
          </article>
        </div>}
      </section>

      <section id="how-it-works" className="steps"><div className="section-heading"><p className="eyebrow"><span></span> HOW IT WORKS</p><h2>One photo.<br/><em>A clearer answer.</em></h2></div><div className="step-grid"><article><span>01</span><Icon name="upload" size={24}/><h3>Upload</h3><p>Add a clear image from your phone or computer.</p></article><article><span>02</span><Icon name="spark" size={24}/><h3>Choose a mode</h3><p>Ask for a general explanation or named visible parts.</p></article><article><span>03</span><Icon name="image" size={24}/><h3>Understand</h3><p>Use the clear labels, scene details, and confidence notes.</p></article></div></section>

      <section id="use-cases" className="use-cases"><div className="section-heading"><p className="eyebrow"><span></span> BUILT FOR THE CURIOUS</p><h2>Useful for more than<br/><em>just engines.</em></h2></div><div className="use-case-grid"><article><span className="case-icon">01</span><h3>Engine bays</h3><p>Get familiar names for the parts you can see before opening a manual.</p></article><article><span className="case-icon">02</span><h3>Tools & machinery</h3><p>Understand unfamiliar equipment, controls, and visible mechanical components.</p></article><article><span className="case-icon">03</span><h3>Appliances & electronics</h3><p>Explore visible modules, cables, housings, and hardware in everyday devices.</p></article></div></section>

      <section id="faq" className="faq"><div><p className="eyebrow"><span></span> FAQ</p><h2>Good to know<br/><em>before you upload.</em></h2></div><div className="faq-list"><details open><summary>How accurate are the part names?<span>+</span></summary><p>Looksee identifies only visible components and displays confidence levels. Treat the output as a helpful starting point and verify important labels with a manual or qualified technician.</p></details><details><summary>Can Looksee diagnose an engine fault?<span>+</span></summary><p>No. Looksee describes what is visible; it does not diagnose faults, recommend repairs, or confirm compatibility or part numbers.</p></details><details><summary>Do you keep my photo?<span>+</span></summary><p>Looksee is designed for one-time visual analysis. Your uploaded image is not made public and no account is required for this version.</p></details></div></section>

      <section id="about" className="final-cta"><p className="eyebrow"><span></span> READY WHEN YOU ARE</p><h2>Have a photo you<br/><em>can’t decode?</em></h2><p>One upload, one plain-language answer. No sign-up and no clutter.</p><button className="primary-button" onClick={() => document.querySelector('#analyze')?.scrollIntoView({ behavior: 'smooth' })}>Start an analysis <Icon name="arrow" size={17}/></button></section>
    </main>

    <footer id="privacy" className="site-footer"><div><a className="brand" href="#top"><span className="brand-mark"><Icon name="spark" size={15}/></span><span>looksee</span></a><p>Upload a photo and get a clear, plain-language description of what is visible — including the names of visible parts.</p></div><nav><h3>Product</h3><a href="#analyze">Analyze an image</a><a href="#how-it-works">How it works</a><a href="#use-cases">Use cases</a></nav><nav><h3>About</h3><a href="#faq">FAQ</a><a href="#about">Our approach</a><a href="#privacy">Privacy</a></nav><small>Looksee is an assistive visual-understanding tool. It does not diagnose faults, recommend repairs, or confirm part numbers. Verify important information before acting. © 2026 Looksee.</small></footer>
  </div>
}
