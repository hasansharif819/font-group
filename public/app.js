document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fontUploadInput = document.getElementById('fontUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const fontList = document.getElementById('fontList');
    const fontGroupForm = document.getElementById('fontGroupForm');
    const fontGroupRows = document.getElementById('fontGroupRows');
    const addRowBtn = document.getElementById('addRowBtn');
    const fontGroupList = document.getElementById('fontGroupList');
    const editModal = document.getElementById('editModal');
    const editFontGroupForm = document.getElementById('editFontGroupForm');
    const editGroupId = document.getElementById('editGroupId');
    const editGroupName = document.getElementById('editGroupName');
    const editFontGroupRows = document.getElementById('editFontGroupRows');
    const editAddRowBtn = document.getElementById('editAddRowBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
  
    // State
    let fonts = [];
    let fontGroups = [];
  
    // Initialize the app
    loadFonts();
    loadFontGroups();
  
    // Event Listeners
    fontUploadInput.addEventListener('change', handleFontUpload);
    addRowBtn.addEventListener('click', addFontRow);
    fontGroupForm.addEventListener('submit', handleCreateFontGroup);
    editAddRowBtn.addEventListener('click', () => addFontRow(editFontGroupRows, true));
    editFontGroupForm.addEventListener('submit', handleUpdateFontGroup);
    cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));
  
    // Functions
    async function loadFonts() {
      try {
        const response = await fetch('/api/fonts');
        if (!response.ok) throw new Error('Failed to load fonts');
        fonts = await response.json();
        renderFontList();
        updateFontSelects();
      } catch (error) {
        console.error('Error loading fonts:', error);
        alert('Failed to load fonts');
      }
    }
  
    async function loadFontGroups() {
      try {
        const response = await fetch('/api/font-groups');
        if (!response.ok) throw new Error('Failed to load font groups');
        fontGroups = await response.json();
        renderFontGroupList();
      } catch (error) {
        console.error('Error loading font groups:', error);
        alert('Failed to load font groups');
      }
    }
  
    async function handleFontUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
  
      uploadStatus.textContent = 'Uploading...';
      uploadStatus.className = 'mt-2 text-sm text-blue-600';
  
      const formData = new FormData();
      formData.append('font', file);
  
      try {
        const response = await fetch('/api/fonts', {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) throw new Error('Upload failed');
  
        const newFont = await response.json();
        fonts.push(newFont);
        renderFontList();
        updateFontSelects();
        
        uploadStatus.textContent = 'Upload successful!';
        uploadStatus.className = 'mt-2 text-sm text-green-600';
        
        // Reset the input to allow uploading the same file again
        fontUploadInput.value = '';
      } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.textContent = error.message || 'Upload failed';
        uploadStatus.className = 'mt-2 text-sm text-red-600';
      }
    }
  
    function renderFontList() {
      fontList.innerHTML = fonts.map(font => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">${font.name}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="font-preview" style="font-family: '${font.name}'">Example Style</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <button class="use-font-btn px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600" data-font-id="${font.id}">Use</button>
          </td>
        </tr>
      `).join('');
  
      // Add event listeners to "Use" buttons
      document.querySelectorAll('.use-font-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const fontId = btn.getAttribute('data-font-id');
          const font = fonts.find(f => f.id === fontId);
          if (font) {
            addFontRow(fontGroupRows, false, font.id);
          }
        });
      });
    }
  
    function updateFontSelects(container = document) {
      const selects = container.querySelectorAll('.font-select');
      selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
          <option value="">Select a font</option>
          ${fonts.map(font => `
            <option value="${font.id}" ${currentValue === font.id ? 'selected' : ''}>${font.name}</option>
          `).join('')}
        `;
      });
    }
  
    function addFontRow(container = fontGroupRows, isEditMode = false, selectedFontId = null) {
      const row = document.createElement('div');
      row.className = 'font-group-row flex items-center space-x-4';
      
      const select = document.createElement('select');
      select.className = 'font-select flex-1 px-3 py-2 border border-gray-300 rounded-md';
      select.required = true;
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-row-btn px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600';
      removeBtn.textContent = 'Remove';
      
      row.appendChild(select);
      row.appendChild(removeBtn);
      container.appendChild(row);
      
      updateFontSelects(container);
      
      if (selectedFontId) {
        select.value = selectedFontId;
      }
      
      removeBtn.addEventListener('click', () => {
        row.remove();
        // Show remove button on the first row if there are multiple rows left
        const rows = container.querySelectorAll('.font-group-row');
        if (rows.length > 1) {
          rows[0].querySelector('.remove-row-btn').classList.remove('hidden');
        }
      });
      
      // Hide remove button if it's the first row and not in edit mode
      if (!isEditMode && container.querySelectorAll('.font-group-row').length === 1) {
        removeBtn.classList.add('hidden');
      }
    }
  
    async function handleCreateFontGroup(e) {
      e.preventDefault();
      
      const groupName = document.getElementById('groupName').value;
      const fontSelects = fontGroupRows.querySelectorAll('.font-select');
      const selectedFonts = Array.from(fontSelects)
        .map(select => select.value)
        .filter(value => value);
      
      if (selectedFonts.length < 2) {
        alert('Please select at least 2 fonts for the group');
        return;
      }
      
      try {
        const response = await fetch('/api/font-groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupName,
            fonts: selectedFonts
          })
        });
        
        if (!response.ok) throw new Error('Failed to create font group');
        
        const newGroup = await response.json();
        fontGroups.push(newGroup);
        renderFontGroupList();
        
        // Reset the form
        fontGroupForm.reset();
        fontGroupRows.innerHTML = '';
        addFontRow();
      } catch (error) {
        console.error('Error creating font group:', error);
        alert('Failed to create font group');
      }
    }
  
    function renderFontGroupList() {
      fontGroupList.innerHTML = fontGroups.map(group => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">${group.name}</td>
          <td class="px-6 py-4">
            <ul class="list-disc pl-5">
              ${group.fonts.map(fontId => {
                const font = fonts.find(f => f.id === fontId);
                return font ? `<li>${font.name}</li>` : '';
              }).join('')}
            </ul>
          </td>
          <td class="px-6 py-4 whitespace-nowrap space-x-2">
            <button class="edit-group-btn px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600" data-group-id="${group.id}">Edit</button>
            <button class="delete-group-btn px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600" data-group-id="${group.id}">Delete</button>
          </td>
        </tr>
      `).join('');
      
      // Add event listeners to edit and delete buttons
      document.querySelectorAll('.edit-group-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-group-id')));
      });
      
      document.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteFontGroup(btn.getAttribute('data-group-id')));
      });
    }
  
    function openEditModal(groupId) {
      const group = fontGroups.find(g => g.id === groupId);
      if (!group) return;
      
      editGroupId.value = group.id;
      editGroupName.value = group.name;
      editFontGroupRows.innerHTML = '';
      
      // Add rows for each font in the group
      group.fonts.forEach(fontId => {
        addFontRow(editFontGroupRows, true, fontId);
      });
      
      editModal.classList.remove('hidden');
    }
  
    async function handleUpdateFontGroup(e) {
      e.preventDefault();
      
      const groupId = editGroupId.value;
      const groupName = editGroupName.value;
      const fontSelects = editFontGroupRows.querySelectorAll('.font-select');
      const selectedFonts = Array.from(fontSelects)
        .map(select => select.value)
        .filter(value => value);
      
      if (selectedFonts.length < 2) {
        alert('Please select at least 2 fonts for the group');
        return;
      }
      
      try {
        const response = await fetch(`/api/font-groups/${groupId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupName,
            fonts: selectedFonts
          })
        });
        
        if (!response.ok) throw new Error('Failed to update font group');
        
        const updatedGroup = await response.json();
        const index = fontGroups.findIndex(g => g.id === groupId);
        if (index !== -1) {
          fontGroups[index] = updatedGroup;
        }
        renderFontGroupList();
        editModal.classList.add('hidden');
      } catch (error) {
        console.error('Error updating font group:', error);
        alert('Failed to update font group');
      }
    }
  
    async function deleteFontGroup(groupId) {
      if (!confirm('Are you sure you want to delete this font group?')) return;
      
      try {
        const response = await fetch(`/api/font-groups/${groupId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete font group');
        
        fontGroups = fontGroups.filter(g => g.id !== groupId);
        renderFontGroupList();
      } catch (error) {
        console.error('Error deleting font group:', error);
        alert('Failed to delete font group');
      }
    }
  });