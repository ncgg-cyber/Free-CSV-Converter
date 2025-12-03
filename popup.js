document.addEventListener('DOMContentLoaded', function() {
  // Tab Switching
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Link Handling
  const links = document.getElementsByTagName("a");
  for (let i = 0; i < links.length; i++) {
    (function() {
      const ln = links[i];
      const location = ln.href;
      ln.onclick = function() {
        chrome.tabs.create({active: true, url: location});
        return false;
      };
    })();
  }

  // Quick Convert Logic
  const input = document.getElementById('csv-input');
  const output = document.getElementById('output');
  const outputContainer = document.getElementById('output-container');
  const btnJson = document.getElementById('btn-json');
  const btnMd = document.getElementById('btn-md');
  const btnClear = document.getElementById('btn-clear');
  const btnCopy = document.getElementById('btn-copy');
  const btnExample = document.getElementById('btn-example');

  // Example Data
  const exampleCSV = `Name,Email,City,Age
John Doe,john@example.com,New York,28
Jane Smith,jane@example.com,Los Angeles,32
Bob Wilson,bob@example.com,"San Francisco, CA",45`;

  btnExample.addEventListener('click', () => {
    input.value = exampleCSV;
    outputContainer.style.display = 'none';
    output.value = '';
  });

  // Smart CSV Parser - handles quotes, commas inside fields, different delimiters
  function parseCSV(text) {
    // Auto-detect delimiter
    const firstLine = text.split(/\r?\n/)[0] || '';
    let delimiter = ',';
    if (firstLine.includes('\t') && !firstLine.includes(',')) {
      delimiter = '\t';
    } else if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
    }

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    if (rows.length < 1) return { headers: [], data: [], rows: [] };

    const headers = rows[0];
    const result = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
      
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j] || '';
      }
      result.push(obj);
    }
    
    return { headers, data: result, rows };
  }

  function showOutput() {
    outputContainer.style.display = 'flex';
  }

  btnJson.addEventListener('click', () => {
    if (!input.value.trim()) return;
    try {
      const { data } = parseCSV(input.value);
      output.value = JSON.stringify(data, null, 2);
      showOutput();
    } catch (e) {
      output.value = 'Error parsing CSV: ' + e.message;
      showOutput();
    }
  });

  btnMd.addEventListener('click', () => {
    if (!input.value.trim()) return;
    try {
      const { headers, data } = parseCSV(input.value);
      if (headers.length === 0) return;

      let md = '| ' + headers.join(' | ') + ' |\n';
      md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      data.forEach(row => {
        md += '| ' + headers.map(h => (row[h] || '').replace(/\|/g, '\\|')).join(' | ') + ' |\n';
      });
      
      output.value = md;
      showOutput();
    } catch (e) {
      output.value = 'Error parsing CSV: ' + e.message;
      showOutput();
    }
  });

  btnClear.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    outputContainer.style.display = 'none';
    input.focus();
  });

  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(output.value).then(() => {
      const originalText = btnCopy.innerText;
      btnCopy.innerText = 'Copied!';
      setTimeout(() => {
        btnCopy.innerText = originalText;
      }, 1500);
    }).catch(() => {
      output.select();
      document.execCommand('copy');
    });
  });
});
