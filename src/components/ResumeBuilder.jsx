import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveResume, loadResume, getRecentResumes } from '../firestoreResume';

export default function ResumeBuilder() {
  // Preload Chinese font and calculate preview width
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Calculate PDF width for live preview
    const calculatePreviewWidth = () => {
      const pdf = new jsPDF('p', 'px', 'a4');
      const margins = { right: 0.15 * 96, left: 0.15 * 96 };
      const pageWidth = pdf.internal.pageSize.getWidth();
      // Set width to be 20% wider for input fields to ensure proper wrapping
      setLivePreviewWidth((pageWidth - margins.left - margins.right) * 1.2);
    };
    
    calculatePreviewWidth();
    window.addEventListener('resize', calculatePreviewWidth);
    return () => window.removeEventListener('resize', calculatePreviewWidth);
  }, []);
  const [data, setData] = useState({
    name: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    education: [ { institution: '', degree: '', dates: '', location: '', details: [''] } ],
    skills: [ { skill: '' } ],
    experience: [ { position: '', company: '', dates: '', location: '', details: [''] } ],
    projects: [ { title: '', dates: '', description: [''] } ],
    createdAt: new Date().toISOString() // Add creation timestamp
  });

  const [order, setOrder] = useState(['profile','education','skills','experience','projects']);
  const [showPreview, setShowPreview] = useState(false);
  const [livePreviewWidth, setLivePreviewWidth] = useState(0);
  const [resumeId, setResumeId] = useState('');
  const [cloudStatus, setCloudStatus] = useState('');
  const [performanceMetrics, setPerformanceMetrics] = useState({ saveTime: 0, loadTime: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recentResumes, setRecentResumes] = useState([]);
  const [showRecentResumes, setShowRecentResumes] = useState(false);

  const handleBasic = e => setData({ ...data, [e.target.name]: e.target.value });

  const handleArray = (section, idx, field, value) => {
    const arr = [...data[section]];
    arr[idx][field] = value;
    setData({ ...data, [section]: arr });
  };

  const addItem = section => {
    const blank = section === 'education'
      ? { institution: '', degree: '', dates: '', location: '', details: [''] }
      : section === 'experience'
        ? { position: '', company: '', dates: '', location: '', details: [''] }
      : section === 'projects'
        ? { title: '', dates: '', description: [''] }
      : section === 'skills'
        ? { skill: '' }
      : {};
    setData({ ...data, [section]: [...data[section], blank] });
  };

  const removeItem = (section, idx) => {
    setData({ ...data, [section]: data[section].filter((_,i)=>i!==idx) });
  };

  const togglePreview = () => {
    setShowPreview(p => !p);
    
    // If switching to preview mode, apply PDF-like styling
    if (!showPreview) {
      setTimeout(() => {
        const preview = document.getElementById('resume-preview');
        if (preview) {
          applyPDFStyling(preview);
        }
      }, 100);
    }
  };

  const moveSection = (section, dir) => {
    setOrder(prev => {
      const idx = prev.indexOf(section);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const newOrder = [...prev];
      [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
      return newOrder;
    });
  };

  const handleBulletChange = (section, idx, bIdx, value, field='details') => {
    const arr = [...data[section]];
    const items = Array.isArray(arr[idx][field]) ? [...arr[idx][field]] : [arr[idx][field]];
    items[bIdx] = value;
    arr[idx][field] = items;
    setData({ ...data, [section]: arr });
  };

  const addBullet = (section, idx, bIdx, field='details') => {
    const arr = [...data[section]];
    const items = Array.isArray(arr[idx][field]) ? 
      [...arr[idx][field].slice(0, bIdx + 1), '', ...arr[idx][field].slice(bIdx + 1)] : 
      [arr[idx][field], ''];
    arr[idx][field] = items;
    setData({ ...data, [section]: arr });
  };

  const removeBullet = (section, idx, bIdx, field='details') => {
    const arr = [...data[section]];
    const items = Array.isArray(arr[idx][field]) ? arr[idx][field].filter((_,i)=>i!==bIdx) : [];
    arr[idx][field] = items;
    setData({ ...data, [section]: arr });
  };

  const applyPDFStyling = (preview) => {
    // Keep form heading size and font
    const formHeadings = document.querySelectorAll('h3.text-xl');
    formHeadings.forEach(heading => {
      heading.style.fontSize = '24px';
      heading.style.fontWeight = '600';
      heading.style.fontFamily = "'Times New Roman', serif";
    });
    const pdf = new jsPDF('p', 'px', 'a4');
    // Optimize margins for single page (in inches → px at 96dpi)
    const margins = { top: 0.05 * 96, right: 0.15 * 96, bottom: 0.35 * 96, left: 0.15 * 96 };
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Apply styling to preview
    preview.style.width = `${pageWidth - margins.left - margins.right}px`;
    preview.style.margin = '0';
    preview.style.padding = '0';
    preview.style.fontSize = '8.8px';
    preview.style.fontFamily = "'Times New Roman', serif";
    preview.style.wordWrap = 'break-word';
    preview.style.overflowWrap = 'break-word';
    preview.style.whiteSpace = 'normal';
    preview.style.wordBreak = 'break-word';
    preview.style.hyphens = 'auto';
    
    // Adjust table alignment
    const leftCells = preview.querySelectorAll('td:first-child');
    leftCells.forEach(cell => {
      cell.style.textAlign = 'left';
      cell.style.paddingLeft = '0';
    });
    
    const rightCells = preview.querySelectorAll('td:last-child');
    rightCells.forEach(cell => {
      cell.style.textAlign = 'right';
      cell.style.paddingRight = '0';
      cell.style.width = '30%'; // Ensure right cell has fixed width
    });
    
    // Ensure date and location are fully right-aligned
    const dateSpans = preview.querySelectorAll('td:last-child span');
    dateSpans.forEach(span => {
      span.style.float = 'right';
      span.style.display = 'block';
      span.style.width = '100%';
      span.style.textAlign = 'right';
      span.style.paddingRight = '0';
      span.style.marginRight = '0';
      span.style.position = 'relative';
      span.style.right = '0';
    });
    
    // Adjust table width
    const tables = preview.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.tableLayout = 'fixed';
    });
    
    // Improve bullet points
    const bullets = preview.querySelectorAll('[style*="textIndent"]');
    bullets.forEach(bullet => {
      bullet.style.paddingLeft = '1.2ch';
      bullet.style.textIndent = '-1ch';
      bullet.style.marginBottom = '0.5px';
      bullet.style.lineHeight = '1.2';
      bullet.style.wordWrap = 'break-word';
      bullet.style.overflowWrap = 'break-word';
      bullet.style.whiteSpace = 'pre-wrap';
    });
    
    // Add spacing between sections
    const sections = preview.querySelectorAll('section');
    sections.forEach(section => {
      section.style.marginBottom = '8px';
      section.style.lineHeight = '1.15';
    });
    
    return { pageWidth, margins };
  };
  
  const downloadPDF = async () => {
    const needShow = !showPreview;
    if (needShow) setShowPreview(true);
    await new Promise(r => setTimeout(r, 100));
    document.querySelectorAll('.controls').forEach(el => el.style.visibility = 'hidden');
    const pdf = new jsPDF('p', 'px', 'a4');
    
    // ensure correct container width for wrapping
    const preview = document.getElementById('resume-preview');
    const { pageWidth, margins } = applyPDFStyling(preview);
    
    // Use html2canvas to handle Chinese text instead of relying on jsPDF font support
    preview.style.fontFamily = "'Noto Sans TC', sans-serif";
    
    // Set PDF basic properties
    pdf.setLanguage('zh-CN');
    pdf.setProperties({
      title: `${data.name || 'Resume'} - CV`,
      subject: 'Resume',
      author: data.name || 'User',
      keywords: 'resume, cv, job application',
      creator: 'Instant Resume Builder'
    });
    
    // Ensure tables render correctly
    const tables = preview.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.tableLayout = 'fixed';
      table.style.borderCollapse = 'collapse';
      table.style.marginLeft = '0';
      table.style.marginRight = '0';
      const rows = table.querySelectorAll('tr');
      let prevRow = null;
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if(cells.length >= 2) {
          cells[0].style.width = '75%';
          cells[0].style.paddingRight = '12px';
          cells[0].style.paddingLeft = '0';
          cells[1].style.width = '25%';
          cells[1].style.whiteSpace = 'nowrap';
          cells[1].style.textAlign = 'right';
          cells[1].style.paddingRight = '0';
          cells[0].style.wordWrap = 'break-word';
          cells[0].style.overflowWrap = 'break-word';
          
          // Reduce spacing between rows
          if (index % 2 === 1) { // Even/odd pairs (institution-degree, company-position)
            cells[0].style.paddingTop = '0';
            cells[1].style.paddingTop = '0';
            row.style.marginTop = '-4px';
          }
        }
        prevRow = row;
      });
    });
    // Improve bullet points
    const bullets = preview.querySelectorAll('[style*="textIndent"]');
    bullets.forEach(bullet => {
      bullet.style.paddingLeft = '1.2ch';
      bullet.style.textIndent = '-1ch';
      bullet.style.marginBottom = '0.5px';
      bullet.style.lineHeight = '1.2';
      bullet.style.wordWrap = 'break-word';
      bullet.style.overflowWrap = 'break-word';
      bullet.style.whiteSpace = 'pre-wrap';
    });
    
    // Adjust table alignment
    const leftCells = preview.querySelectorAll('td:first-child');
    leftCells.forEach(cell => {
      cell.style.textAlign = 'left';
      cell.style.paddingLeft = '0';
    });
    
    const rightCells = preview.querySelectorAll('td:last-child');
    rightCells.forEach(cell => {
      cell.style.textAlign = 'right';
      cell.style.paddingRight = '0';
    });
    // Add spacing between sections
    const sections = preview.querySelectorAll('section');
    sections.forEach(section => {
      section.style.marginBottom = '8px';
      section.style.lineHeight = '1.15';
    });
    // Capture the preview as an image
    html2canvas(document.getElementById('resume-preview'), {
      scale: 4, // Much higher scale for better resolution
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Ensure cloned document also has correct font
        const clonedPreview = clonedDoc.getElementById('resume-preview');
        if (clonedPreview) {
          clonedPreview.style.fontFamily = "'Noto Sans TC', sans-serif";
        }
      }
    }).then(canvas => {
      // Add the canvas image to the PDF with high quality
      const imgData = canvas.toDataURL('image/png', 1.0); // Use highest quality
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - margins.left - margins.right;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Use high quality settings to add image
      pdf.addImage({
        imageData: imgData,
        x: margins.left,
        y: margins.top,
        width: pdfWidth,
        height: pdfHeight,
        compression: 'NONE',
        alias: 'resume-image'
      });
      
      // Handle hyperlinks
      const callback = () => {
          // add clickable link annotations
          const container = document.getElementById('resume-preview');
          const containerRect = container.getBoundingClientRect();
          container.querySelectorAll('a').forEach(a => {
            const rect = a.getBoundingClientRect();
            pdf.link(
              margins.left + rect.left - containerRect.left,
              margins.top + rect.top - containerRect.top,
              rect.width,
              rect.height,
              { url: a.href }
            );
          });
          // Complete PDF generation
          pdf.save(`${data.name || 'resume'}.pdf`);
          if (needShow) setShowPreview(false);
          document.querySelectorAll('.controls').forEach(el => el.style.visibility = 'visible');
        };
        
        // Execute callback
        callback();
    });
  };

  // Monitor network status changes
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setCloudStatus('Network connection restored');
      } else {
        setCloudStatus('Currently in offline mode. Changes will sync when network is restored');
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // --- Firestore Cloud Save/Load ---
  const handleSaveToCloud = async () => {
    setCloudStatus('Saving...');
    try {
      // Add timestamp
      const resumeData = {
        ...data,
        updatedAt: new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      const result = await saveResume(resumeData, resumeId || null);
      
      if (result.success) {
        setResumeId(result.id);
        setPerformanceMetrics(prev => ({ ...prev, saveTime: result.saveTime }));
        setCloudStatus(`Save successful! Resume ID: ${result.id} (${result.saveTime.toFixed(0)}ms)`);
        
        // Update recent resumes list
        fetchRecentResumes();
      } else {
        setCloudStatus(`Save failed: ${result.message}`);
      }
    } catch (e) {
      setCloudStatus(`Save failed: ${e.message}`);
      console.error('Save error:', e);
    }
  };
  
  const handleLoadFromCloud = async () => {
    if (!resumeId.trim()) {
      setCloudStatus('Please enter a valid Resume ID');
      return;
    }
    
    setCloudStatus('Loading...');
    try {
      const result = await loadResume(resumeId);
      
      if (result.success && result.data) {
        setData(result.data);
        setPerformanceMetrics(prev => ({ ...prev, loadTime: result.loadTime }));
        
        const source = result.fromCache ? 'from local cache' : 'from cloud';
        setCloudStatus(`Load successful! ${source} (${result.loadTime.toFixed(0)}ms)`);
      } else {
        setCloudStatus(`Load failed: ${result.message || 'Resume not found'}`);
      }
    } catch (e) {
      setCloudStatus(`Load failed: ${e.message}`);
      console.error('Load error:', e);
    }
  };
  
  // Get recent resumes
  const fetchRecentResumes = async () => {
    try {
      const result = await getRecentResumes(5);
      if (result.success) {
        setRecentResumes(result.resumes);
      }
    } catch (e) {
      console.error('Error fetching recent resumes:', e);
    }
  };
  
  // Load specific resume
  const loadResumeById = async (id) => {
    setResumeId(id);
    setShowRecentResumes(false);
    
    setCloudStatus('Loading...');
    try {
      const result = await loadResume(id);
      
      if (result.success && result.data) {
        setData(result.data);
        setPerformanceMetrics(prev => ({ ...prev, loadTime: result.loadTime }));
        setCloudStatus(`Load successful! (${result.loadTime.toFixed(0)}ms)`);
      } else {
        setCloudStatus(`Load failed: ${result.message || 'Resume not found'}`);
      }
    } catch (e) {
      setCloudStatus(`Load failed: ${e.message}`);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-4xl font-bold text-center mb-4">Resume Builder</h1>
        <div className="flex items-center space-x-6">
          {/* Preview & Download Group */}
          <div className="flex items-center space-x-2">
            <button onClick={togglePreview} className="px-4 py-2 bg-googleBlue text-white rounded">
              {showPreview ? 'Show Form' : 'Show Preview'}
            </button>
            <button onClick={downloadPDF} className="px-4 py-2 bg-googleBlue text-white rounded">Download PDF</button>
          </div>
          
          {/* Load from Cloud Group */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input 
                className="border px-2 py-2 rounded" 
                type="text" 
                placeholder="Resume ID" 
                value={resumeId} 
                onChange={e => setResumeId(e.target.value)} 
                style={{width:'180px', maxWidth: '180px'}} 
              />
              {recentResumes.length > 0 && (
                <button 
                  onClick={() => setShowRecentResumes(!showRecentResumes)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  title="Show recent resumes"
                >
                  ▼
                </button>
              )}
              {showRecentResumes && recentResumes.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
                  {recentResumes.map(resume => (
                    <div 
                      key={resume.id} 
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => loadResumeById(resume.id)}
                    >
                      <div className="font-medium">{resume.name || 'Unnamed Resume'}</div>
                      <div className="text-xs text-gray-500">{resume.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="px-3 py-2 bg-blue-600 text-white rounded" 
              onClick={handleSaveToCloud} 
              type="button"
              disabled={!navigator.onLine}
              title={!navigator.onLine ? 'Cannot save in offline mode' : ''}
            >
              Save to Cloud
            </button>
            <button 
              className="px-3 py-2 bg-green-600 text-white rounded" 
              onClick={handleLoadFromCloud} 
              type="button"
            >
              Load from Cloud
            </button>
            <button 
              onClick={fetchRecentResumes}
              className="px-2 py-2 bg-gray-200 text-gray-700 rounded"
              title="Refresh recent resumes"
            >
              ↻
            </button>
          </div>
        </div>
        
        {cloudStatus && (
          <div className={`mt-2 p-2 rounded ${!navigator.onLine ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex justify-between items-center">
              <div>{cloudStatus}</div>
              {(performanceMetrics.saveTime > 0 || performanceMetrics.loadTime > 0) && (
                <div className="text-xs text-gray-500">
                  {performanceMetrics.saveTime > 0 && `Save: ${performanceMetrics.saveTime.toFixed(0)}ms`}
                  {performanceMetrics.saveTime > 0 && performanceMetrics.loadTime > 0 && ' | '}
                  {performanceMetrics.loadTime > 0 && `Load: ${performanceMetrics.loadTime.toFixed(0)}ms`}
                </div>
              )}
            </div>
          </div>
        )}
        
        <hr className="border-t border-gray-300 my-4 w-full" />
      </div>
      <style>{`
        /* avoid page breaks and base styling */
        #resume-preview section {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 0.5rem;
          font-family: 'Times New Roman';
          font-size: 8.8px;
        }
        /* container fills wrapper; no extra padding */
        #resume-preview {
          width: 100%;
          margin: 0;
          padding: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          word-break: break-word;
        }
        /* Standardize input and textarea fonts */
        input, textarea, ::placeholder {
          font-family: 'Arial', sans-serif;
        }
        /* headings */
        #resume-preview h1 {
          font-family: Arial;
          font-size: 11.8px;
          font-weight: bold;
          margin: 0;
          padding: 0;
        }
        /* Form headings */
        h3.text-xl {
          font-size: 24px !important;
          font-weight: 600 !important;
          font-family: 'Times New Roman', serif !important;
        }
        /* Make institution, company, and project titles bold */
        #resume-preview .font-bold {
          font-weight: bold !important;
        }
        #resume-preview h2 {
          font-family: Arial;
          font-size: 10px;
          font-weight: bold;
          margin: 0;
          padding: 0;
        }
        /* horizontal rule styling */
        #resume-preview hr {
          border: none;
          border-top: 1px solid #000;
          margin: 0;
        }
        /* no gap under hr */
        #resume-preview hr + div {
          margin-top: 0;
        }
        /* spacing between entries in the same section */
        #resume-preview section > div + div {
          margin-top: 0.3rem;
        }
        /* profile contact line flush under name, single line */
        #resume-preview h1 + .contact-info,
        #resume-preview .contact-info {
          margin: -2px 0 4px 0;
          white-space: nowrap;
        }
        /* separator line directly under headings */
        #resume-preview h2 + hr {
          margin: 0;
        }
        /* link styling */
        #resume-preview a {
          font-weight: normal;
          text-decoration: none;
          color: #000;
          cursor: pointer;
        }
        #resume-preview a:hover {
          opacity: 0.8;
        }
        /* remove indent on bullets */
        #resume-preview ul {
          padding-left: 0;
          margin-left: 0;
        }
        /* remove underline for contact links */
        #resume-preview .contact-info a {
          text-decoration: none;
        }
        /* input and textarea width limit */
        #resume-preview input, #resume-preview textarea {
          maxWidth: 180px;
        }
      `}</style>
      <div className="py-6 max-w-5xl mx-auto px-4">
        {!showPreview ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{fontSize: '24px', fontFamily: 'Times New Roman'}}>Profile</h3>
              <hr className="border-t border-gray-300 mb-4" />
            </div>
            {/* Profile */}
            <div style={{order: order.indexOf('profile')}}>
              <div className="space-y-2">
                <div>
                  <input placeholder="Name" name="name" value={data.name} onChange={handleBasic} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring font-bold" style={{maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%'}} />
                </div>
                <div className="flex space-x-2">
                  <input placeholder="Location" name="location" value={data.location} onChange={handleBasic} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%'}} />
                  <input placeholder="Phone" name="phone" value={data.phone} onChange={handleBasic} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%'}} />
                </div>
                <div className="flex space-x-2">
                  <input placeholder="Email" name="email" value={data.email} onChange={handleBasic} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%'}} />
                  <input placeholder="LinkedIn URL" name="linkedin" value={data.linkedin} onChange={handleBasic} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%'}} />
                </div>
                <div>
                  <input placeholder="GitHub URL" name="github" value={data.github} onChange={handleBasic} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%'}} />
                </div>
              </div>
            </div>
            {/* Education */}
            <div style={{order: order.indexOf('education')}}>
              <h3 className="text-xl font-semibold mb-2">Education</h3>
              <hr className="border-t border-gray-300 mb-4" />
              {data.education.map((ed, i) => (
                <div key={i} className="space-y-2 mb-4 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input placeholder="Institution" value={ed.institution} onChange={e=>handleArray('education',i,'institution',e.target.value)} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring font-bold" style={{maxWidth: '180px'}} />
                      <input placeholder="Dates" value={ed.dates} onChange={e=>handleArray('education',i,'dates',e.target.value)} className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                    </div>
                    <div className="flex space-x-2">
                      <input placeholder="Degree" value={ed.degree} onChange={e=>handleArray('education',i,'degree',e.target.value)} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                      <input placeholder="Location" value={ed.location} onChange={e=>handleArray('education',i,'location',e.target.value)} className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                    </div>
                  </div>
                  {ed.details.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center mb-2 relative">

                      <div className="flex w-full items-center">
                        <textarea 
                          placeholder="Bullet point" 
                          value={bullet} 
                          onChange={e=>handleBulletChange('education',i,bIdx,e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const cursorPosition = e.target.selectionStart;
                              const textBeforeCursor = e.target.value.substring(0, cursorPosition);
                              const textAfterCursor = e.target.value.substring(cursorPosition);
                              const newValue = textBeforeCursor + '\n' + textAfterCursor;
                              handleBulletChange('education',i,bIdx,newValue);
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                              setTimeout(() => {
                                e.target.selectionStart = cursorPosition + 1;
                                e.target.selectionEnd = cursorPosition + 1;
                              }, 0);
                            }
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring resize-none overflow-hidden whitespace-pre-wrap" 
                          style={{
                            minHeight: '32px',
                            width: '100%',
                            maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                          onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                        <div className="flex items-center ml-2">
                          <button onClick={()=>addBullet('education',i,bIdx)} className="text-xl text-googleGreen font-bold">+</button>
                          {bIdx > 0 && <button onClick={()=>removeBullet('education',i,bIdx)} className="text-xl text-red-500 font-bold ml-1">-</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {i === data.education.length - 1 && (
                    <div className="flex mt-1 space-x-2">
                      <button onClick={()=>addItem('education')} className="px-2 py-1 bg-googleGreen text-white rounded text-xs">Add Education</button>
                      {i>0 && <button onClick={()=>removeItem('education',i)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Remove</button>}
                    </div>
                  )}
                </div>
              ))}

            </div>
            {/* Skills */}
            <div style={{order: order.indexOf('skills')}}>
              <h3 className="text-xl font-semibold mb-2">Skills</h3>
              <hr className="border-t border-gray-300 mb-4" />
              {data.skills.map((skill,i)=>(
                <div key={i} className="mb-4 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex">
                      <textarea
                      value={skill.skill}
                      onChange={e=>handleArray('skills',i,'skill',e.target.value)}
                      placeholder="Bullet point"
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:ring resize-none overflow-hidden whitespace-pre-wrap"
                      style={{ 
                        minHeight: '40px', 
                        width: '100%',
                        maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const cursorPosition = e.target.selectionStart;
                          const textBeforeCursor = e.target.value.substring(0, cursorPosition);
                          const textAfterCursor = e.target.value.substring(cursorPosition);
                          const newValue = textBeforeCursor + '\n' + textAfterCursor;
                          handleArray('skills',i,'skill',newValue);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          setTimeout(() => {
                            e.target.selectionStart = cursorPosition + 1;
                            e.target.selectionEnd = cursorPosition + 1;
                          }, 0);
                        }
                      }}
                    />
                  </div>
                  {i === data.skills.length - 1 && (
                    <div className="flex mt-1 space-x-2">
                      <button onClick={()=>addItem('skills')} className="px-2 py-1 bg-googleGreen text-white rounded text-xs">Add Skill</button>
                      {i>0 && <button onClick={()=>removeItem('skills',i)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Remove</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Experience */}
            <div style={{order: order.indexOf('experience')}}>
              <h3 className="text-xl font-semibold mb-2">Experience</h3>
              <hr className="border-t border-gray-300 mb-4" />
              {data.experience.map((ex,i)=>(
                <div key={i} className="mb-4 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input placeholder="Company" value={ex.company} onChange={e=>handleArray('experience',i,'company',e.target.value)} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring font-bold" style={{maxWidth: '180px'}} />
                      <input placeholder="Dates" value={ex.dates} onChange={e=>handleArray('experience',i,'dates',e.target.value)} className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                    </div>
                    <div className="flex space-x-2">
                      <input placeholder="Position" value={ex.position} onChange={e=>handleArray('experience',i,'position',e.target.value)} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                      <input placeholder="Location" value={ex.location} onChange={e=>handleArray('experience',i,'location',e.target.value)} className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                    </div>
                  </div>
                  {ex.details.map((bullet,bIdx)=>(
                    <div key={bIdx} className="flex items-center mb-2 relative">

                      <div className="flex w-full items-center">
                        <textarea 
                          placeholder="Bullet point" 
                          value={bullet} 
                          onChange={e=>handleBulletChange('experience',i,bIdx,e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const cursorPosition = e.target.selectionStart;
                              const textBeforeCursor = e.target.value.substring(0, cursorPosition);
                              const textAfterCursor = e.target.value.substring(cursorPosition);
                              const newValue = textBeforeCursor + '\n' + textAfterCursor;
                              handleBulletChange('experience',i,bIdx,newValue);
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                              setTimeout(() => {
                                e.target.selectionStart = cursorPosition + 1;
                                e.target.selectionEnd = cursorPosition + 1;
                              }, 0);
                            }
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring resize-none overflow-hidden whitespace-pre-wrap" 
                          style={{
                            minHeight: '32px',
                            width: '100%',
                            maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                          onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                        <div className="flex items-center ml-2">
                          <button onClick={()=>addBullet('experience',i,bIdx)} className="text-xl text-googleGreen font-bold">+</button>
                          {bIdx > 0 && <button onClick={()=>removeBullet('experience',i,bIdx)} className="text-xl text-red-500 font-bold ml-1">-</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {i === data.experience.length - 1 && (
                    <div className="flex mt-1 space-x-2">
                      <button onClick={()=>addItem('experience')} className="px-2 py-1 bg-googleGreen text-white rounded text-xs">Add Experience</button>
                      {i>0 && <button onClick={()=>removeItem('experience',i)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Remove</button>}
                    </div>
                  )}
                </div>
              ))}

            </div>
            {/* Projects */}
            <div style={{order: order.indexOf('projects')}}>
              <h3 className="text-xl font-semibold mb-2">Projects</h3>
              <hr className="border-t border-gray-300 mb-4" />
              {data.projects.map((pr,i)=>(
                <div key={i} className="space-y-2 mb-4 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex space-x-2">
                    <input placeholder="Title" value={pr.title} onChange={e=>handleArray('projects',i,'title',e.target.value)} className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring font-bold" style={{maxWidth: '180px'}} />
                    <input placeholder="Dates" value={pr.dates} onChange={e=>handleArray('projects',i,'dates',e.target.value)} className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring" style={{maxWidth: '180px'}} />
                  </div>
                  {pr.description.map((bullet,bIdx)=>(
                    <div key={bIdx} className="flex items-center mb-2 relative">

                      <div className="flex w-full items-center">
                        <textarea 
                          placeholder="Bullet point" 
                          value={bullet} 
                          onChange={e=>handleBulletChange('projects',i,bIdx,e.target.value,'description')} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const cursorPosition = e.target.selectionStart;
                              const textBeforeCursor = e.target.value.substring(0, cursorPosition);
                              const textAfterCursor = e.target.value.substring(cursorPosition);
                              const newValue = textBeforeCursor + '\n' + textAfterCursor;
                              handleBulletChange('projects',i,bIdx,newValue,'description');
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                              setTimeout(() => {
                                e.target.selectionStart = cursorPosition + 1;
                                e.target.selectionEnd = cursorPosition + 1;
                              }, 0);
                            }
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring resize-none overflow-hidden whitespace-pre-wrap" 
                          style={{
                            minHeight: '32px',
                            width: '100%',
                            maxWidth: livePreviewWidth ? `${livePreviewWidth}px` : '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                          onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                        <div className="flex items-center ml-2">
                          <button onClick={()=>addBullet('projects',i,bIdx,'description')} className="text-xl text-googleGreen font-bold">+</button>
                          {bIdx > 0 && <button onClick={()=>removeBullet('projects',i,bIdx,'description')} className="text-xl text-red-500 font-bold ml-1">-</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {i === data.projects.length - 1 && (
                    <div className="flex mt-1 space-x-2">
                      <button onClick={()=>addItem('projects')} className="px-2 py-1 bg-googleGreen text-white rounded text-xs">Add Project</button>
                      {i>0 && <button onClick={()=>removeItem('projects',i)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Remove</button>}
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        ) : (
          <div id="resume-preview-wrapper" className="mx-auto" style={{ width: '210mm', height: '297mm', overflow: 'auto', padding: '0.15in 0.2in 0.19in 0.2in', boxSizing: 'border-box', backgroundColor: '#f0f0f0' }}>
            <div id="resume-preview" className="bg-white shadow" style={{ boxSizing: 'border-box', padding: '0.2in' }}>
              {order.map(sectionKey => {
                switch (sectionKey) {
                  case 'profile':
                    return (
                      <section key="profile" className="">
                        <div className="flex justify-center items-center space-x-2 whitespace-nowrap" style={{marginBottom: '0px'}}>
                          <h1 className="text-2xl font-semibold inline-flex items-center space-x-2">
                            <span>{data.name}</span>
                            <span className="controls inline-flex space-x-1">
                              <button disabled={order[0]==='profile'} onClick={()=>moveSection('profile','up')} className="text-sm">↑</button>
                              <button disabled={order[order.length-1]==='profile'} onClick={()=>moveSection('profile','down')} className="text-sm">↓</button>
                            </span>
                          </h1>
                        </div>
                        <div className="contact-info flex flex-nowrap justify-center items-center space-x-1" style={{fontFamily: 'Times New Roman', fontSize: '8.8px', marginTop: '-2px'}}>
                          {data.location && <><span>{data.location}</span>{(data.phone || data.email || data.linkedin || data.github) && <span className="mx-1" style={{margin: '0 0.5em'}}>|</span>}</>}
                          {data.phone && <><span>{data.phone}</span>{(data.email || data.linkedin || data.github) && <span className="mx-1" style={{margin: '0 0.5em'}}>|</span>}</>}
                          {data.email && <><a href={`mailto:${data.email}`} target="_blank" rel="noopener noreferrer" title="Ctrl+Click to open link">{data.email}</a>{(data.linkedin || data.github) && <span className="mx-1" style={{margin: '0 0.5em'}}>|</span>}</>}
                          {data.linkedin && <><a href={/^(https?:\/\/)/.test(data.linkedin) ? data.linkedin : `https://${data.linkedin}`} target="_blank" rel="noopener noreferrer" title="Ctrl+Click to open link">{data.linkedin}</a>{data.github && <span className="mx-1" style={{margin: '0 0.5em'}}>|</span>}</>}
                          {data.github && <a href={/^(https?:\/\/)/.test(data.github) ? data.github : `https://${data.github}`} target="_blank" rel="noopener noreferrer" title="Ctrl+Click to open link">{data.github.replace(/^https?:\/\/(www\.)?/i, '')}</a>}
                        </div>
                      </section>
                    );
                  case 'education':
                    return (
                      <section key="education" className="mb-6">
                        <h2 className="text-xl font-semibold uppercase inline-flex items-center space-x-2 mb-3 whitespace-nowrap">
                          <span>Education</span>
                          <span className="controls inline-flex space-x-1">
                            <button disabled={order[0]==='education'} onClick={()=>moveSection('education','up')} className="text-sm">↑</button>
                            <button disabled={order[order.length-1]==='education'} onClick={()=>moveSection('education','down')} className="text-sm">↓</button>
                          </span>
                        </h2>
                        <hr className="border-t border-gray-300 mb-3 mx-4" />
                        {data.education.map((ed, i) => (
                          <div key={i} className="pb-4 mb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                            <table className="w-full mb-2 border-collapse" style={{tableLayout: 'fixed'}}>
                              <tbody>
                                <tr>
                                  <td className="text-left w-3/4" style={{paddingLeft: '0'}}>
                                    <span className="font-bold text-sm" style={{fontWeight: 'bold'}}>{ed.institution}</span>
                                  </td>
                                  <td className="text-right w-1/4" style={{whiteSpace: 'nowrap', paddingRight: '0'}}>
                                    <span className="text-sm text-gray-600">{ed.dates}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="text-left w-3/4" style={{paddingLeft: '0'}}>
                                    <span className="text-sm">{ed.degree}</span>
                                  </td>
                                  <td className="text-right w-1/4" style={{whiteSpace: 'nowrap', paddingRight: '0'}}>
                                    <span className="text-sm text-gray-600">{ed.location}</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            {ed.details && (
                              <div className="text-xs mt-1">
                                {ed.details.map((bullet, bIdx) => (
                                  <div key={bIdx} style={{ 
                                    marginBottom: '2px', 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    display: 'flex',
                                    wordBreak: 'break-all',
                                    hyphens: 'auto'
                                  }}>
                                    <span style={{ minWidth: '1ch', marginRight: '0' }}>•</span>
                                    <span style={{ 
                                      flex: 1, 
                                      paddingLeft: '0.5ch',
                                      wordBreak: 'break-all',
                                      hyphens: 'auto'
                                    }}>{bullet}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </section>
                    );
                  case 'skills':
                    return (
                      <section key="skills" className="mb-6">
                        <h2 className="text-xl font-semibold uppercase inline-flex items-center space-x-2 mb-3 whitespace-nowrap">
                          <span>Skills</span>
                          <span className="controls inline-flex space-x-1">
                            <button disabled={order[0]==='skills'} onClick={()=>moveSection('skills','up')} className="text-sm">↑</button>
                            <button disabled={order[order.length-1]==='skills'} onClick={()=>moveSection('skills','down')} className="text-sm">↓</button>
                          </span>
                        </h2>
                        <hr className="border-t border-gray-300 mb-3 mx-4" />
                        {data.skills.length > 0 && (
                          <div className="text-xs">
                            {data.skills.map((skill, i) => (
                              <div key={i} style={{ 
                                wordWrap: 'break-word', 
                                overflowWrap: 'break-word', 
                                whiteSpace: 'normal',
                                display: 'flex',
                                marginBottom: '1.2px'
                              }}>
                                <span style={{ minWidth: '1ch', marginRight: '0' }}>•</span>
                                <span style={{ 
                                  flex: 1, 
                                  paddingLeft: '0.5ch',
                                  wordBreak: 'break-all',
                                  hyphens: 'auto'
                                }}>{skill.skill}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  case 'experience':
                    return (
                      <section key="experience" className="mb-6">
                        <h2 className="text-xl font-semibold uppercase inline-flex items-center space-x-2 mb-3 whitespace-nowrap">
                          <span>Experience</span>
                          <span className="controls inline-flex space-x-1">
                            <button disabled={order[0]==='experience'} onClick={()=>moveSection('experience','up')} className="text-sm">↑</button>
                            <button disabled={order[order.length-1]==='experience'} onClick={()=>moveSection('experience','down')} className="text-sm">↓</button>
                          </span>
                        </h2>
                        <hr className="border-t border-gray-300 mb-3 mx-4" />
                        {data.experience.map((ex, i) => (
                          <div key={i} className="pb-4 mb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                            <table className="w-full mb-2 border-collapse" style={{tableLayout: 'fixed'}}>
                              <tbody>
                                <tr>
                                  <td className="text-left w-3/4" style={{paddingLeft: '0'}}>
                                    <span className="font-bold text-sm" style={{fontWeight: 'bold'}}>{ex.company}</span>
                                  </td>
                                  <td className="text-right w-1/4" style={{whiteSpace: 'nowrap', paddingRight: '0'}}>
                                    <span className="text-sm text-gray-600">{ex.dates}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="text-left w-3/4" style={{paddingLeft: '0'}}>
                                    <span className="text-sm">{ex.position}</span>
                                  </td>
                                  <td className="text-right w-1/4" style={{whiteSpace: 'nowrap', paddingRight: '0'}}>
                                    <span className="text-sm text-gray-600">{ex.location}</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            {ex.details && (
                              <div className="text-xs mt-1">
                                {ex.details.map((bullet, bIdx) => (
                                  <div key={bIdx} style={{ 
                                    marginBottom: '2px', 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    display: 'flex',
                                    wordBreak: 'break-all',
                                    hyphens: 'auto'
                                  }}>
                                    <span style={{ minWidth: '1ch', marginRight: '0' }}>•</span>
                                    <span style={{ 
                                      flex: 1, 
                                      paddingLeft: '0.5ch',
                                      wordBreak: 'break-all',
                                      hyphens: 'auto'
                                    }}>{bullet}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </section>
                    );
                  case 'projects':
                    return (
                      <section key="projects" className="mb-6">
                        <h2 className="text-xl font-semibold uppercase inline-flex items-center space-x-2 mb-3 whitespace-nowrap">
                          <span>Projects</span>
                          <span className="controls inline-flex space-x-1">
                            <button disabled={order[0]==='projects'} onClick={()=>moveSection('projects','up')} className="text-sm">↑</button>
                            <button disabled={order[order.length-1]==='projects'} onClick={()=>moveSection('projects','down')} className="text-sm">↓</button>
                          </span>
                        </h2>
                        <hr className="border-t border-gray-300 mb-3 mx-4" />
                        {data.projects.map((pr, i) => (
                          <div key={i} className="pb-4 mb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                            <table className="w-full mb-2 border-collapse" style={{tableLayout: 'fixed'}}>
                              <tbody>
                                <tr>
                                  <td className="text-left w-3/4" style={{paddingRight: '10px', paddingLeft: '0'}}>
                                    <span className="font-bold text-sm" style={{fontWeight: 'bold'}}>{pr.title}</span>
                                  </td>
                                  <td className="text-right w-1/4" style={{whiteSpace: 'nowrap', paddingRight: '0'}}>
                                    <span className="text-sm text-gray-600">{pr.dates}</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            {pr.description && (
                              <div className="text-xs mt-1">
                                {pr.description.map((bullet, bIdx) => (
                                  <div key={bIdx} style={{ 
                                    marginBottom: '2px', 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    display: 'flex',
                                    wordBreak: 'break-all',
                                    hyphens: 'auto'
                                  }}>
                                    <span style={{ minWidth: '1ch', marginRight: '0' }}>•</span>
                                    <span style={{ 
                                      flex: 1, 
                                      paddingLeft: '0.5ch',
                                      wordBreak: 'break-all',
                                      hyphens: 'auto'
                                    }}>{bullet}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </section>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
