/**
 * JavaScript injections for automating the NIE Parents Portal.
 */

export const ScraperScripts = {
  /**
   * Automates the login form using USN and DOB.
   */
  login: (usn: string, dob: string, fatherMobileLast4: string = '') => {
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

    const safeUsn = usn.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeDay = day.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeMonth = month.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeYear = year.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeFatherLast4 = (fatherMobileLast4 || '').replace(/\D/g, '').slice(-4).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return `
      (function() {
        const notify = (msg) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', data: msg }));
        };

        const setFieldValue = (el, value) => {
          if (!el) return;
          el.focus && el.focus();
          const proto = el.tagName === 'SELECT'
            ? window.HTMLSelectElement && window.HTMLSelectElement.prototype
            : window.HTMLInputElement && window.HTMLInputElement.prototype;
          const valueSetter = proto && Object.getOwnPropertyDescriptor(proto, 'value') && Object.getOwnPropertyDescriptor(proto, 'value').set;
          if (valueSetter) {
            valueSetter.call(el, value);
          } else {
            el.value = value;
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur', { bubbles: true }));
          el.blur && el.blur();
        };

        const setSelectValue = (selectEl, preferredValues) => {
          if (!selectEl || !preferredValues || !preferredValues.length) return false;
          const options = Array.from(selectEl.options || []);
          for (const wanted of preferredValues) {
            const found = options.find((opt) => opt.value === wanted);
            if (found) {
              selectEl.selectedIndex = found.index;
              setFieldValue(selectEl, wanted);
              return true;
            }
          }
          return false;
        };

        const submitForm = (btnOrField) => {
          const form = btnOrField && btnOrField.form ? btnOrField.form : document.querySelector('form#login-form') || document.querySelector('form');
          if (form && typeof form.requestSubmit === 'function') {
            form.requestSubmit();
            return true;
          }
          if (form && typeof form.submit === 'function') {
            form.submit();
            return true;
          }
          return false;
        };

        notify('Scraper: Starting login for ${safeUsn}');
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

          const verificationSelect = document.querySelector('#id-type-select');
          const verificationDigits = Array.from(document.querySelectorAll('.digit-input'));
          const verificationSubmitBtn = document.querySelector('input[type="submit"]');
          const enteredIdField = document.querySelector('#enteredid');

          // New flow: verification page after OTP login
          if (verificationSelect && verificationDigits.length >= 4 && verificationSubmitBtn) {
            clearInterval(checkInterval);
            notify('Scraper: Verification page detected');

            // Prefer father mobile verification type, fallback to value "1"
            const verificationTypeSet =
              setSelectValue(verificationSelect, ['1']) ||
              setSelectValue(
                verificationSelect,
                Array.from(verificationSelect.options || [])
                  .filter((o) => /father/i.test((o.text || '') + ' ' + (o.innerText || '')))
                  .map((o) => o.value)
              );

            if (!verificationTypeSet) {
              notify('Scraper warning: Could not explicitly set verification type, continuing with current selection');
            }

            const digits = "${safeFatherLast4}";
            if (digits.length !== 4) {
              notify('Scraper ERROR: Father mobile last 4 digits missing/invalid');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                data: 'Portal needs father mobile last 4 digits. Please save a valid 4-digit value and retry.'
              }));
              return;
            }

            verificationDigits.slice(0, 4).forEach((input, idx) => {
              setFieldValue(input, digits[idx]);
            });
            if (enteredIdField) {
              setFieldValue(enteredIdField, digits);
            }

            notify('Scraper: Submitting verification form');
            setTimeout(() => {
              const submitted = submitForm(verificationSubmitBtn);
              if (!submitted) verificationSubmitBtn.click();
            }, 80);
            return;
          } else {
            const userField = document.querySelector('#username');
            const daySelect = document.querySelector('#dd');
            const monthSelect = document.querySelector('#mm');
            const yearSelect = document.querySelector('#yyyy');
            const submitBtn = document.querySelector('input[type="submit"]');

            if (userField && daySelect && monthSelect && yearSelect && submitBtn) {
              clearInterval(checkInterval);
              notify('Scraper: Found DOB login fields');
              setFieldValue(userField, "${safeUsn}");

              const daySet = setSelectValue(daySelect, ["${safeDay}", "${safeDay} ", "${safeDay}".trim()]);
              if (!daySet) {
                notify('Scraper warning: Could not set day from dropdown options');
              }
              setSelectValue(monthSelect, ["${safeMonth}"]);
              setSelectValue(yearSelect, ["${safeYear}"]);

              if (typeof putdate === 'function') putdate();
              if (typeof submitLogin === 'function') submitLogin();
              notify('Scraper: Submitting DOB login form');
              setTimeout(() => {
                const submitted = submitForm(submitBtn);
                if (!submitted) submitBtn.click();
              }, 80);
              return;
            }
          }
          
          if (attempts >= 18) {
            clearInterval(checkInterval);
            notify('Scraper ERROR: Login/verification timed out');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              data: 'Login timed out while waiting for portal fields.'
            }));
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
            subjects.push({ code, name, attendance: '', attendanceLink, cieLink });
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

              // Forcibly extract attendance percentage from CIE page text
              let attMatch = bodyTxt.match(/Attendance\\s+([\\d.]+)%/i);
              if (attMatch && attMatch[1]) {
                 sub.attendance = attMatch[1] + '%';
              } else if (sub.attendanceDetails.length > 0) {
                 // Fallback: Mathematically calculate attendance directly from the calendar list!
                 let conducted = sub.attendanceDetails.length;
                 let present = sub.attendanceDetails.filter(d => d.status === 'Present').length;
                 sub.attendance = Math.round((present / conducted) * 100) + '%';
              } else {
                 sub.attendance = '0%';
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
