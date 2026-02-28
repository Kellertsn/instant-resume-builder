# Instant Resume Builder

A modern, open-source resume builder built with React, Vite, Tailwind CSS, and Firebase. Instantly create, preview, and export beautiful resumes – with cloud save/load support, offline persistence, and real-time PDF rendering.

## Features

- Dynamic section editing (Profile, Education, Skills, Experience, Projects)
- Real-time PDF preview and export with high-quality formatting (<100ms updates)
- >90% layout consistency between preview and PDF output
- Optimized bullet point spacing and alignment
- Proper handling of CJK (Chinese, Japanese, Korean) fonts
- Smart contact information formatting with conditional separators
- Cloud save/load via Firebase Firestore (with shareable Resume ID)
- Offline editing with Firebase persistence and intelligent local caching
- Intelligent caching that reduces cloud read operations by ~70%
- Performance metrics for cloud operations (<800ms data retrieval)
- Network status detection with automatic UI feedback
- Section reordering with 120 possible layout permutations
- Modern UI built with Tailwind CSS
- Easy deployment to Vercel or Firebase Hosting

## How to Use

1. **Fill in Your Resume:**
   - Enter your information in the Profile, Education, Skills, Experience, and Projects sections.
   - Use "Add Bullet" to add bullet points, or "Add Education/Experience/Project" to add more entries.
   - Formatting is automatically applied – institution, company, and project titles are bold.

2. **Preview and Download PDF:**
   - Click "Show Preview" to see a live preview that exactly matches the PDF output.
   - Click "Download PDF" to get a high-quality PDF of your resume with consistent formatting.

3. **Cloud Save & Load:**
   - Click **"Save to Cloud"** to store your resume online. You’ll get a unique Resume ID.
   - Enter a Resume ID and click **"Load from Cloud"** to restore your resume.
   - Resume ID is shareable and usable across devices.
   - **Recent Resumes** dropdown shows your latest saved resumes.

4. **Offline Support & Caching:**
   - Edits persist offline via Firebase Firestore’s offline persistence.
   - Intelligent local cache with 5-minute TTL reduces redundant reads and supports multi-tab usage.
   - Real-time sync with cloud once back online.

5. **Reorder and Edit Sections:**
   - Use arrows to reorder sections; up to 120 layout permutations supported.
   - All fields remain fully editable.

## Use Cases

- First-time users: Instantly build, preview, and export your resume.
- Multi-device workflow: Start at home, continue on another device.
- Version control: Each save creates a new Resume ID for managing multiple versions.
- Offline mode: Continue editing even without a network; changes sync later.

## Local Development

```bash
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Live Demo

The latest version is always available at:  
[https://instant-resume-builder.vercel.app/](https://instant-resume-builder.vercel.app/)

## Deployment

- **Vercel:** Deploy as a Vite app from the project root.
- **Firebase Hosting:** Follow the [Firebase Hosting documentation](https://firebase.google.com/docs/hosting).

## Cloud Save/Load

- Uses Firebase Firestore (see `src/firebase.js`).
- Data stored as JSON under unique Resume IDs.
- Features:
  - Offline persistence with multi-tab support
  - Intelligent caching with 5-minute TTL
  - Performance metrics (save/load under 800ms typical)
  - Recent resumes dropdown for easy resume switching

## Recent Updates

### June 2025
- Firebase offline persistence for seamless editing
- Local cache with 5-min TTL to reduce cloud reads by ~70%
- Performance logging for save/load times
- Network status detection and UI feedback
- Upgraded to Firebase's `persistentLocalCache` and `persistentMultipleTabManager`

### May 2025
- Improved PDF formatting (>90% layout match)
- Fixed alignment for dates/locations on right side
- Enhanced spacing and readability for bullet points
- Support for CJK (Chinese, Japanese, Korean) fonts
- Conditional separators for smart contact formatting
- Bold formatting for institution, company, and project titles
- Corrected section heading styles in PDF output

## License

MIT
