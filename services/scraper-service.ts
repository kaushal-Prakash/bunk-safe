/**
 * JavaScript injections for automating the NIE Parents Portal.
 */

export const ScraperScripts = {
  /**
   * Automates the login form using USN and DOB.
   */
  login: (usn: string, dob: string) => {
    const [year, month, day] = dob.split('-'); // Assuming YYYY-MM-DD
    return `
      (function() {
        const userField = document.querySelector('#username');
        const daySelect = document.querySelector('#dd');
        const monthSelect = document.querySelector('#mm');
        const yearSelect = document.querySelector('#yyyy');
        const submitBtn = document.querySelector('input[type="submit"]');

        if (userField && daySelect && monthSelect && yearSelect) {
          userField.value = "${usn}";
          daySelect.value = "${day} "; // Note the trailing space in the HTML option value
          monthSelect.value = "${month}";
          yearSelect.value = "${year}";
          
          // Trigger the page's own logic if needed
          if (typeof putdate === 'function') putdate();
          
          // Submit
          submitBtn.click();
        }
      })();
    `;
  },

  /**
   * Scrapes the main dashboard for the list of subjects and their detail links.
   */
  scrapeSubjectList: `
    (function() {
      const rows = document.querySelectorAll('table.dash_even_row tbody tr');
      const subjects = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          const code = cells[0].innerText.trim();
          const name = cells[1].innerText.trim();
          const attendanceLink = cells[3].querySelector('a')?.href;
          const cieLink = cells[4].querySelector('a')?.href;
          
          if (code && name) {
            subjects.push({ code, name, attendanceLink, cieLink });
          }
        }
      });
      
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
      const cieText = document.querySelector('.cn-cie-stat-table td:nth-child(7)')?.innerText || "";
      const attText = document.querySelector('.cn-cie-stat-table td:nth-child(8)')?.innerText || "";
      
      // Extract individual marks (T1, T2, etc)
      const t1 = document.querySelector('.cn-cie-stat-table td:nth-child(1)')?.innerText.split(':')[1]?.trim() || "-";
      const t2 = document.querySelector('.cn-cie-stat-table td:nth-child(2)')?.innerText.split(':')[1]?.trim() || "-";
      const q1 = document.querySelector('.cn-cie-stat-table td:nth-child(3)')?.innerText.split(':')[1]?.trim() || "-";
      const q2 = document.querySelector('.cn-cie-stat-table td:nth-child(4)')?.innerText.split(':')[1]?.trim() || "-";
      const il1 = document.querySelector('.cn-cie-stat-table td:nth-child(5)')?.innerText.split(':')[1]?.trim() || "-";
      const il2 = document.querySelector('.cn-cie-stat-table td:nth-child(6)')?.innerText.split(':')[1]?.trim() || "-";

      const cieValue = cieText.split(':')[1]?.trim() || "0";
      const attValue = attText.split(':')[1]?.trim() || "0%";

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
