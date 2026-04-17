export function generateHTML(table, allTables) {
  const fields = table.fields || [];
  const primaryKeyField = fields.find((f) => f.primary) || fields[0];
  const port = 5000 + (allTables.findIndex((t) => t.id === table.id) + 1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${table.name} - CRUD Prototype</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #175e7a;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #175e7a;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #175e7a;
        }
        .form-group .required {
            color: #e53935;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .btn-primary {
            background-color: #175e7a;
            color: white;
        }
        .btn-primary:hover {
            background-color: #0d475a;
        }
        .btn-success {
            background-color: #43a047;
            color: white;
        }
        .btn-success:hover {
            background-color: #388e3c;
        }
        .btn-warning {
            background-color: #f9a825;
            color: white;
        }
        .btn-warning:hover {
            background-color: #f57f17;
        }
        .btn-danger {
            background-color: #e53935;
            color: white;
        }
        .btn-danger:hover {
            background-color: #c62828;
        }
        .btn-secondary {
            background-color: #757575;
            color: white;
        }
        .btn-secondary:hover {
            background-color: #616161;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        th {
            background-color: #f5f5f5;
            font-weight: 600;
            color: #333;
        }
        tr:hover {
            background-color: #fafafa;
        }
        .action-btns {
            display: flex;
            gap: 5px;
        }
        .action-btns .btn {
            padding: 5px 10px;
            font-size: 12px;
            margin: 0;
        }
        .message {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
        }
        .message.show {
            display: block;
        }
        .message.success {
            background-color: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #a5d6a7;
        }
        .message.error {
            background-color: #ffebee;
            color: #c62828;
            border: 1px solid #ef9a9a;
        }
        .hidden {
            display: none !important;
        }
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #757575;
        }
        .empty-state i {
            font-size: 48px;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-overlay.hidden {
            display: none;
        }
        .modal {
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #757575;
        }
        .modal-footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${table.name} - CRUD Prototype</h1>
        
        <div id="message" class="message"></div>
        
        <div class="card">
            <div class="card-title">Add New Record</div>
            <form id="addForm">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
${fields.map((field) => `
                    <div class="form-group">
                        <label>
                            ${field.name}
                            ${field.notNull || field.primary ? '<span class="required">*</span>' : ''}
                            ${field.primary ? '<small>(PK)</small>' : ''}
                        </label>
                        <input 
                            type="${getInputType(field)}" 
                            name="${field.name}" 
                            ${field.primary ? 'id="primaryKeyField"' : ''}
                            ${field.notNull && !field.primary ? 'required' : ''}
                            ${field.increment ? 'placeholder="Auto-increment"' : ''}
                        />
                    </div>
`).join('')}
                </div>
                <button type="submit" class="btn btn-primary">
                    <span id="addBtnText">Add Record</span>
                    <span id="addBtnLoading" class="hidden">Adding...</span>
                </button>
                <button type="button" class="btn btn-secondary" id="cancelEditBtn" onclick="cancelEdit()">Cancel Edit</button>
            </form>
        </div>
        
        <div class="card">
            <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Records (${fields.length} fields)</span>
                <button class="btn btn-secondary" onclick="refreshData()">Refresh</button>
            </div>
            <div id="dataTable">
                <div class="empty-state">
                    <i>📋</i>
                    <p>Loading data...</p>
                </div>
            </div>
        </div>
    </div>
    
    <div id="editModal" class="modal-overlay hidden">
        <div class="modal">
            <div class="modal-header">
                <h3>Edit Record</h3>
                <button class="modal-close" onclick="closeEditModal()">&times;</button>
            </div>
            <form id="editForm">
${fields.map((field) => `
                <div class="form-group">
                    <label>
                        ${field.name}
                        ${field.notNull || field.primary ? '<span class="required">*</span>' : ''}
                        ${field.primary ? '<small>(PK - Read-only)</small>' : ''}
                    </label>
                    <input 
                        type="${getInputType(field)}" 
                        name="${field.name}" 
                        id="edit_${field.name}"
                        ${field.primary ? 'readonly style="background-color: #f5f5f5;"' : ''}
                    />
                </div>
`).join('')}
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
    
    <div id="deleteModal" class="modal-overlay hidden">
        <div class="modal">
            <div class="modal-header">
                <h3>Confirm Delete</h3>
                <button class="modal-close" onclick="closeDeleteModal()">&times;</button>
            </div>
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
                <button type="button" class="btn btn-danger" onclick="confirmDelete()">Delete</button>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = 'http://localhost:${port}';
        const TABLE_NAME = '${table.name}';
        const PRIMARY_KEY = '${primaryKeyField ? primaryKeyField.name : fields[0]?.name || 'id'}';
        
        let currentEditId = null;
        let deleteId = null;
        let isEditMode = false;
        
        function showMessage(text, type = 'success') {
            const msgEl = document.getElementById('message');
            msgEl.textContent = text;
            msgEl.className = \`message show \${type}\`;
            setTimeout(() => {
                msgEl.classList.remove('show');
            }, 3000);
        }
        
        async function fetchData() {
            try {
                const response = await fetch(\`\${API_BASE}/api/\${TABLE_NAME}\`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error fetching data:', error);
                showMessage('Failed to connect to server. Make sure the Python server is running.', 'error');
                return null;
            }
        }
        
        async function refreshData() {
            const data = await fetchData();
            renderTable(data);
        }
        
        function renderTable(data) {
            const tableEl = document.getElementById('dataTable');
            
            if (!data || data.length === 0) {
                tableEl.innerHTML = \`
                    <div class="empty-state">
                        <i>📭</i>
                        <p>No records yet. Add your first record above.</p>
                    </div>
                \`;
                return;
            }
            
            const fields = [
${fields.map((f) => `'${f.name}'`).join(',\n')}
            ];
            
            let html = \`
                <table>
                    <thead>
                        <tr>
\${fields.map(f => \`<th>\${f}</th>\`).join('')}
                            <th style="width: 150px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            \`;
            
            data.forEach((row, index) => {
                html += '<tr>';
                fields.forEach(field => {
                    const value = row[field] !== undefined && row[field] !== null ? row[field] : '-';
                    html += \`<td>\${escapeHtml(String(value))}</td>\`;
                });
                const pkValue = row[PRIMARY_KEY];
                html += \`
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-warning" onclick="openEditModal(\${typeof pkValue === 'string' ? \`'\${pkValue}'\` : pkValue})">Edit</button>
                            <button class="btn btn-danger" onclick="openDeleteModal(\${typeof pkValue === 'string' ? \`'\${pkValue}'\` : pkValue})">Delete</button>
                        </div>
                    </td>
                \`;
                html += '</tr>';
            });
            
            html += \`
                    </tbody>
                </table>
            \`;
            
            tableEl.innerHTML = html;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        document.getElementById('addForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {};
            
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            const addBtn = this.querySelector('button[type="submit"]');
            const btnText = document.getElementById('addBtnText');
            const btnLoading = document.getElementById('addBtnLoading');
            
            addBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            
            try {
                let response;
                if (isEditMode && currentEditId !== null) {
                    response = await fetch(\`\${API_BASE}/api/\${TABLE_NAME}/\${currentEditId}\`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                } else {
                    response = await fetch(\`\${API_BASE}/api/\${TABLE_NAME}\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                }
                
                if (response.ok) {
                    showMessage(isEditMode ? 'Record updated successfully!' : 'Record added successfully!', 'success');
                    this.reset();
                    cancelEdit();
                    refreshData();
                } else {
                    const error = await response.json();
                    showMessage(error.error || 'Operation failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Failed to connect to server', 'error');
            } finally {
                addBtn.disabled = false;
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
            }
        });
        
        function cancelEdit() {
            isEditMode = false;
            currentEditId = null;
            document.getElementById('addForm').reset();
            document.getElementById('cancelEditBtn').classList.add('hidden');
            
            const pkField = document.getElementById('primaryKeyField');
            if (pkField) {
                pkField.readOnly = false;
                pkField.style.backgroundColor = '';
            }
        }
        
        async function openEditModal(id) {
            const data = await fetchData();
            const record = data.find(r => {
                if (typeof r[PRIMARY_KEY] === 'number') {
                    return r[PRIMARY_KEY] === Number(id);
                }
                return r[PRIMARY_KEY] === id;
            });
            
            if (!record) return;
            
            isEditMode = true;
            currentEditMode = id;
            
            const form = document.getElementById('addForm');
${fields.map((field) => `
            const ${field.name}Input = form.querySelector('input[name="${field.name}"]');
            if (${field.name}Input && record['${field.name}'] !== undefined) {
                ${field.name}Input.value = record['${field.name}'];
            }
`).join('')}
            
            currentEditId = record[PRIMARY_KEY];
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            
            const pkField = document.getElementById('primaryKeyField');
            if (pkField) {
                pkField.readOnly = true;
                pkField.style.backgroundColor = '#f5f5f5';
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        function closeEditModal() {
            document.getElementById('editModal').classList.add('hidden');
        }
        
        function openDeleteModal(id) {
            deleteId = id;
            document.getElementById('deleteModal').classList.remove('hidden');
        }
        
        function closeDeleteModal() {
            deleteId = null;
            document.getElementById('deleteModal').classList.add('hidden');
        }
        
        async function confirmDelete() {
            if (deleteId === null) return;
            
            try {
                const response = await fetch(\`\${API_BASE}/api/\${TABLE_NAME}/\${deleteId}\`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    showMessage('Record deleted successfully!', 'success');
                    closeDeleteModal();
                    refreshData();
                } else {
                    const error = await response.json();
                    showMessage(error.error || 'Delete failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Failed to connect to server', 'error');
            }
        }
        
        document.getElementById('editForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (currentEditId === null) return;
            
            const formData = new FormData(this);
            const data = {};
            
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            try {
                const response = await fetch(\`\${API_BASE}/api/\${TABLE_NAME}/\${currentEditId}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                if (response.ok) {
                    showMessage('Record updated successfully!', 'success');
                    closeEditModal();
                    refreshData();
                } else {
                    const error = await response.json();
                    showMessage(error.error || 'Update failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Failed to connect to server', 'error');
            }
        });
        
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('cancelEditBtn').classList.add('hidden');
            refreshData();
        });
    </script>
</body>
</html>`;
}

function getInputType(field) {
  const type = (field.type || "").toLowerCase();
  
  if (type.includes("int") || type.includes("number") || type.includes("float") || type.includes("double") || type.includes("decimal")) {
    return "number";
  }
  if (type.includes("date") && !type.includes("time")) {
    return "date";
  }
  if (type.includes("datetime") || type.includes("timestamp")) {
    return "datetime-local";
  }
  if (type.includes("time")) {
    return "time";
  }
  if (type.includes("bool")) {
    return "checkbox";
  }
  if (type.includes("text") || type.includes("blob")) {
    return "textarea";
  }
  
  return "text";
}
