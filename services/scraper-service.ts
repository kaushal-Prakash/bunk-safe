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
        const userField = document.querySelector('#username');
        const daySelect = document.querySelector('#dd');
        const monthSelect = document.querySelector('#mm');
        const yearSelect = document.querySelector('#yyyy');
        const submitBtn = document.querySelector('input[type="submit"]');

        if (userField && daySelect && monthSelect && yearSelect) {
          notify('Scraper: Found all form fields');
          userField.value = "${usn}";
          
          // Set dropdowns
          daySelect.value = "${day} "; // NIE Portal uses "DD " value
          notify('Scraper: Set Day to ' + daySelect.value);
          
          monthSelect.value = "${month}";
          notify('Scraper: Set Month to ' + monthSelect.value);
          
          yearSelect.value = "${year}";
          notify('Scraper: Set Year to ' + yearSelect.value);
          
          if (typeof putdate === 'function') {
            notify('Scraper: Triggering putdate()');
            putdate();
          }
          
          notify('Scraper: Clicking submit button');
          submitBtn.click();
        } else {
          notify('Scraper ERROR: Could not find one or more form fields');
        }
      })();
    `;
  },

  /**
   * Scrapes the main dashboard for the list of subjects and their detail links.
   */
  scrapeSubjectList: `
    (function() {
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
            subjects.push({ code, name, attendanceLink, cieLink });
          }
        }
      });
      
      notify('Scraper: Successfully collected ' + subjects.length + ' subjects');

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SUBJECT_LIST',
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

      const cieTable = document.querySelector('.cn-cie-table') || document.querySelector('.cn-cie-stat-table');
      if (!cieTable) {
        if (window._detailsRetries > 8) {
          notify('Scraper ERROR: Gave up finding details table.');
          const tables = Array.from(document.querySelectorAll('table')).map(t => t.className || 'unnamed-table');
          notify('Scraper: Found tables on page: ' + JSON.stringify(tables));
          notify('Scraper: Page text start: ' + document.body.innerText.substring(0, 150).replace(/\\n/g, ' '));
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            data: 'Could not find the CIE/Attendance details table on the page.'
          }));
          return;
        }

        notify('Scraper: Details table not found yet, retrying...');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'RETRY_DETAILS',
          data: 'Details table not found'
        }));
        return;
      }

      // Reset retries for the next subject once we successfully find the table
      window._detailsRetries = 0;

      notify('Scraper: Found details table, extracting data...');

      // Dynamic Extraction logic
      let cieValue = "0";
      let attValue = "0%";
      let t1 = "-", t2 = "-", q1 = "-", q2 = "-", il1 = "-", il2 = "-";

      const cells = Array.from(cieTable.querySelectorAll('td'));
      
      cells.forEach(cell => {
          const text = cell.innerText.trim();
          const upperText = text.toUpperCase();
          
          if (upperText.includes('T1 :')) t1 = text.split(':')[1]?.trim() || "-";
          if (upperText.includes('T2 :')) t2 = text.split(':')[1]?.trim() || "-";
          if (upperText.includes('Q1 :')) q1 = text.split(':')[1]?.trim() || "-";
          if (upperText.includes('Q2 :')) q2 = text.split(':')[1]?.trim() || "-";
          if (upperText.includes('IL1 :')) il1 = text.split(':')[1]?.trim() || "-";
          if (upperText.includes('IL2 :')) il2 = text.split(':')[1]?.trim() || "-";
          
          if (upperText.includes('CIE :')) cieValue = text.split(':')[1]?.trim() || "0";
          if (upperText.includes('ATTENDANCE :')) attValue = text.split(':')[1]?.trim() || "0%";
      });

      notify('Scraper: Extracted - CIE: ' + cieValue + ', ATT: ' + attValue);

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SUBJECT_DETAILS',
        data: {
          cie: {
            t1, t2, q1, q2, il1, il2,
            total: cieValue
          },
          attendance: attValue
        }
      }));
    })();
  `
};
