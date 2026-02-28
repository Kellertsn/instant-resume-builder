import { db } from './firebase';
import { collection, addDoc, doc, getDoc, setDoc, getDocs, query, where, limit } from "firebase/firestore";

// Local cache for better performance
const resumeCache = new Map();

/**
 * Save resume to Firebase
 * @param {Object} data - Resume data
 * @param {string} [existingId] - Optional existing ID for updating instead of creating new document
 * @returns {Object} Object containing ID and performance data
 */
export async function saveResume(data, existingId = null) {
  try {
    const startTime = performance.now();
    let docRef;
    
    if (existingId) {
      // Update existing document
      docRef = doc(db, "resumes", existingId);
      await setDoc(docRef, data, { merge: true });
    } else {
      // Create new document
      docRef = await addDoc(collection(db, "resumes"), data);
    }
    
    const id = existingId || docRef.id;
    
    // Update cache
    resumeCache.set(id, {
      data,
      timestamp: Date.now()
    });
    
    const endTime = performance.now();
    const saveTime = endTime - startTime;
    
    return { 
      id, 
      saveTime,
      success: true,
      message: existingId ? 'Resume updated' : 'Resume saved'
    };
  } catch (error) {
    console.error("Error saving resume:", error);
    return {
      id: existingId,
      success: false,
      message: `Save failed: ${error.message}`,
      error
    };
  }
}

/**
 * Load resume from Firebase
 * @param {string} id - Resume ID
 * @returns {Object} Object containing resume data and performance information
 */
export async function loadResume(id) {
  try {
    // Check cache
    if (resumeCache.has(id)) {
      const cached = resumeCache.get(id);
      const cacheAge = Date.now() - cached.timestamp;
      
      // If cache is less than 5 minutes old, use it directly
      if (cacheAge < 5 * 60 * 1000) {
        return {
          data: cached.data,
          loadTime: 0, // Loaded from cache, time close to 0
          fromCache: true,
          success: true
        };
      }
    }
    
    const startTime = performance.now();
    const docRef = doc(db, "resumes", id);
    const docSnap = await getDoc(docRef);
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Update cache
      resumeCache.set(id, {
        data,
        timestamp: Date.now()
      });
      
      return {
        data,
        loadTime,
        fromCache: false,
        success: true
      };
    } else {
      return {
        data: null,
        loadTime,
        success: false,
        message: 'Resume not found'
      };
    }
  } catch (error) {
    console.error("Error loading resume:", error);
    return {
      data: null,
      success: false,
      message: `Load failed: ${error.message}`,
      error
    };
  }
}

/**
 * Get user's recent resumes
 * @param {number} [maxResults=5] - Maximum number of results
 * @returns {Array} Array of resume IDs and creation times
 */
export async function getRecentResumes(maxResults = 5) {
  try {
    const startTime = performance.now();
    
    const q = query(collection(db, "resumes"), limit(maxResults));
    const querySnapshot = await getDocs(q);
    
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        createdAt: doc.data().createdAt || new Date().toISOString(),
        name: doc.data().name || 'Unnamed Resume'
      });
    });
    
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    
    return {
      resumes: results,
      queryTime,
      success: true
    };
  } catch (error) {
    console.error("Error getting recent resumes:", error);
    return {
      resumes: [],
      success: false,
      message: `Query failed: ${error.message}`,
      error
    };
  }
}
