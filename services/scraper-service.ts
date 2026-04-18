/**
 * JavaScript injections for automating the NIE Parents Portal.
 */

export const ScraperScripts = {
  /**
   * Automates the login form using USN and DOB.
   */
  login: (usn: string, dob: string) => {
    // Handling different DOB formats (YYYY-MM-DD or DD-MM-YYYY)
    let day = '', month = '', year = '';
    
    if (dob.includes('-')) {
      const parts = dob.split('-');
      if (parts[0].length === 4) { // YYYY-MM-DD
        [year, month, day] = parts;
      } else { // DD-MM-YYYY
        [day, month, year] = parts;
      }
    }

    // Ensure day and month have leading zeros + space for day if portal needs it
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `
      (function() {
        const notify = (msg) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', data: msg }));
        };

        notify('Scraper: Starting login for ${usn}');
        let attempts = 0;
        
        let checkInterval = setInterval(() => {
          attempts++;
          const bodyText = document.body ? document.body.innerText : '';
          const isDashboard = bodyText.includes('Course Code') || document.querySelector('table.dash_even_row');
          
          if (isDashboard) {
             clearInterval(checkInterval);
             notify('Scraper: Already on dashboard');
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_ALREADY' }));
             return;
          }

          const userField = document.querySelector('#username');
          const daySelect = document.querySelector('#dd');
          const monthSelect = document.querySelector('#mm');
          const yearSelect = document.querySelector('#yyyy');
          const submitBtn = document.querySelector('input[type="submit"]');

          if (userField && daySelect && monthSelect && yearSelect && submitBtn) {
            clearInterval(checkInterval);
            notify('Scraper: Found all form fields');
            userField.value = "${usn}";
            daySelect.value = "${day} "; // NIE Portal uses "DD " value
            monthSelect.value = "${month}";
            yearSelect.value = "${year}";
            
            if (typeof putdate === 'function') putdate();
            notify('Scraper: Clicking submit button');
            submitBtn.click();
          } else if (attempts >= 10) {
            clearInterval(checkInterval);
            notify('Scraper ERROR: Could not find one or more form fields');
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', data: 'Login fields not found on portal.' }));
          }
        }, 800);
      })();
    `;
  },

  /**
   * Scrapes the main dashboard for the list of subjects and their detail links.
   */
  scrapeSubjectList: `
    (async function() {
      const notify = (msg) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', data: msg }));
      };

      notify('Scraper: Attempting to scrape subject list');
      
      const isDashboard = document.body.innerText.includes('Course Code') || 
                        document.querySelector('table.dash_even_row');
      
      if (!isDashboard) {
        notify('Scraper ERROR: Not on dashboard page. Current body text starts with: ' + document.body.innerText.substring(0, 50));
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'RETRY_LIST',
          data: 'Not on dashboard page'
        }));
        return;
      }

      const rows = document.querySelectorAll('table.dash_even_row tbody tr');
      const subjects = [];
      
      notify('Scraper: Found ' + rows.length + ' rows in table');

      rows.forEach((row, i) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          const code = cells[0].innerText.trim();
          const name = cells[1].innerText.trim();
          
          let attendanceLink = '';
          let cieLink = '';
          const aAtt = cells[3].querySelector('a');
          const aCie = cells[4].querySelector('a');
          
          if (aAtt) {
             attendanceLink = aAtt.href;
          }
          if (aCie) {
             cieLink = aCie.href;
          }
          
          if (code && name && attendanceLink && cieLink) {
            subjects.push({ code, name, attendance: cells[2].innerText.trim(), attendanceLink, cieLink });
          }
        }
      });
      
      notify('Scraper: Found ' + subjects.length + ' subjects. Deep fetching sequentially...');

      const parser = new DOMParser();

      for (const sub of subjects) {
         // --- ATTENDANCE FETCH ---
         try {
           const r1 = await fetch(sub.attendanceLink);
           const html1 = await r1.text();
           const doc1 = parser.parseFromString(html1, 'text/html');
           const dates = [];

           const pTable = doc1.querySelector('table.cn-attend-list1');
           if (pTable) {
              pTable.querySelectorAll('tbody tr').forEach(tr => {
                 const tds = tr.querySelectorAll('td');
                 if (tds.length >= 4) {
                    let rawTime = tds[2].innerText || '';
                    dates.push({
                       date: (tds[1].innerText || '').trim(),
                       time: rawTime.replace(/\\s+TO\\s+/i, ' - ').replace(/\\s+/g, ' ').trim(),
                       status: 'Present'
                    });
                 }
              });
           }

           const aTable = doc1.querySelector('table.cn-attend-list2');
           if (aTable) {
              aTable.querySelectorAll('tbody tr').forEach(tr => {
                 const tds = tr.querySelectorAll('td');
                 if (tds.length >= 4) {
                    let rawTime = tds[2].innerText || '';
                    dates.push({
                       date: (tds[1].innerText || '').trim(),
                       time: rawTime.replace(/\\s+TO\\s+/i, ' - ').replace(/\\s+/g, ' ').trim(),
                       status: 'Absent'
                    });
                 }
              });
           }
           sub.attendanceDetails = dates;
         } catch (e) {
           notify('Scraper warning: Failed fetching attendance detail for ' + sub.code);
           sub.attendanceDetails = [];
         }

         // --- CIE FETCH ---
         try {
           const r2 = await fetch(sub.cieLink);
           const html2 = await r2.text();
           const doc2 = parser.parseFromString(html2, 'text/html');
           const bodyTxt = doc2.body.innerText;

              // Extract generic attendance score from main text as fallback if missing
              if (!sub.attendance) {
                 let attMatch = bodyTxt.match(/Attendance\\s+([\\d.]+)%/i) || bodyTxt.match(/([\\d.]+)%/);
                 sub.attendance = attMatch ? attMatch[1] + '%' : '0%';
              }

              // CIE Parsing (inside the script tags)
              let chartData = [];
              const chartMatch = html2.match(/var\\s+chartData\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;/i);
              
              if (chartMatch && chartMatch[1]) {
                try {
                  // The portal outputs Javascript object arrays, not strict JSON. Evaluating it directly inside the WebView is completely safe and flawless.
                  chartData = eval('(' + chartMatch[1] + ')');
                } catch (e) {
                  notify('Scraper warning: Failed evaluating chart data for ' + sub.code + ' - ' + e.message);
                }
              } else {
                notify('Scraper warning: Could not find chartData string in HTML for ' + sub.code);
              }

              let tMatch = bodyTxt.match(/Total Marks\\s+(\\d+)/i);
              const cieTotal = tMatch ? tMatch[1] : '0';

              const marks = chartData.map(item => {
                 let val = item.col1 !== undefined ? item.col1 : 'Not Taken';
                 let max = 0;
                 if (item.xaxis && item.xaxis.toLowerCase().includes('t')) max = 25; // tests defaults max 25 usually
                 if (item.xaxis && item.xaxis.toLowerCase().includes('q')) max = 5; // quiz defaults max 5 usually
                 return { label: item.xaxis || 'NA', value: String(val), max };
              });

              sub.cie = {
                marks: marks,
                total: cieTotal
              };
         } catch (e) {
              notify('Scraper ERROR fetching CIE for ' + sub.code + ': ' + e.message);
              sub.cie = { total: '0', marks: [] };
         }
      }

      notify('Scraper: Sequential deep fetch complete! All data fully loaded.');
      window.ReactNativeWebView.postMessage(JSON.stringify({
         type: 'SYNC_COMPLETE_FULL',
         data: subjects
      }));
    })();
  `,

  /**
   * Scrapes a subject's detail page for CIE and Attendance.
   */
  scrapeSubjectDetails: `
    (function() {
      const notify = (msg) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', data: msg }));
      };

      // Track retries to avoid infinite loop logging without useful info
      window._detailsRetries = (window._detailsRetries || 0) + 1;

      // The NIE portal often loads the chart JS after some delay, so let's rely on body text or scripts
      const scripts = Array.from(document.scripts).map(s => s.innerHTML).join('\\n');
      const pageText = document.body.innerText;
      
      const containsData = scripts.includes('var chartData =') || pageText.includes('Attendance');
      
      if (!containsData) {
        if (window._detailsRetries > 8) {
          notify('Scraper ERROR: Gave up finding CIE/Attendance data.');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            data: 'Could not find the CIE/Attendance details on the page.'
          }));
          return;
        }

        notify('Scraper: Details not fully loaded yet, retrying...');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'RETRY_DETAILS',
          data: 'Details not loaded'
        }));
        return;
      }

      // Reset retries for the next subject once we successfully find data
      window._detailsRetries = 0;

      notify('Scraper: Found details data, extracting...');

      let cieValue = "0";
      let attValue = "0%";
      let marksArray = [];

      // Try to parse chartData if it exists
      try {
        const scriptMatch = scripts.match(/var\\s+chartData\\s*=\\s*(\\[.*?\\]);/s);
        if (scriptMatch && scriptMatch[1]) {
           // We need to convert the JS object array string to valid JSON. 
           // This means wrapping unquoted keys in double quotes.
           let jsonString = scriptMatch[1]
             .replace(/([{,])\\s*([a-zA-Z0-9_]+)\\s*:/g, '$1"$2":') // Quote keys
             .replace(/'/g, '"') // Replace single quotes with double quotes
             .replace(/,\\s*}/g, '}') // Remove trailing commas in objects
             .replace(/,\\s*]/g, ']'); // Remove trailing commas in arrays
             
           const jsonData = JSON.parse(jsonString); 
           
           jsonData.forEach(item => {
             let val = item.col1 !== undefined ? item.col1.toString() : "-";
             let maxVal = item.maxmarks !== undefined ? Number(item.maxmarks) : 0;
             if (item.col1 === 0 && item.maxmarks === 0) val = "Not Taken";
             
             if (item.xaxis) {
               marksArray.push({ label: item.xaxis, value: val, max: maxVal });
             }
           });
           notify('Scraper: Parsed chartData successfully');
        }
      } catch(e) {
        notify('Scraper warning: Chart Data parse error: ' + e.message);
      }

      // Extract total CIE & Attendance (often found via specific DOM classes or by Regex over table text)
      // NIE portal varies, so we use multiple fallback methods.
      const cieTable = document.querySelector('.cn-cie-table') || document.querySelector('.cn-cie-stat-table') || document.body;
      const cells = Array.from(cieTable.querySelectorAll('td, th, span, div'));
      
      cells.forEach(cell => {
          const text = cell.innerText.trim();
          const upperText = text.toUpperCase();
          
          if (upperText.includes('CIE :')) cieValue = text.split(':')[1]?.trim() || cieValue;
          if (upperText.includes('ATTENDANCE :')) attValue = text.split(':')[1]?.trim() || attValue;
      });
      
      // If still 0% for attendance, sometimes it's in a specific TD
      if (attValue === "0%") {
        const attMatch = pageText.match(/(\\d{1,3}(?:\\.\\d+)?)\\s*%/);
        if (attMatch) {
          attValue = attMatch[1] + '%';
        }
      }

      // If CIE is still 0, try to sum up the T1, Q1, etc if they exist
      if (cieValue === "0" && marksArray.length > 0) {
        let total = 0;
        marksArray.forEach(m => {
          if (!isNaN(parseFloat(m.value))) total += parseFloat(m.value);
        });
        if (total > 0) cieValue = total.toString();
      }

      notify('Scraper: Extracted - CIE: ' + cieValue + ', ATT: ' + attValue);

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SUBJECT_DETAILS',
        data: {
          cie: {
            marks: marksArray,
            total: cieValue
          },
          attendance: attValue
        }
      }));
    })();
  `
};
