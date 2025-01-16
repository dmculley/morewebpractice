let currentData = { nodes: [], edges: [] };
let currentEntryIndex = null;
 const formContainer = document.getElementById('formContainer');
 const tableContainer = document.getElementById('tableContainer');


 async function fetchOntologyData() {
   try {
        const response = await fetch('ontology/ontology_data.json');
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
   } catch (error) {
       console.error('Error fetching ontology data:', error);
       return { nodes: [], edges: [] };
   }
 }

 async function saveData() {
    try {
         const result = await window.electronAPI.saveData(currentData);
        if (result.success) {
           alert('Data saved successfully!');
       } else {
            alert('Error saving data: ' + result.error)
        }

     } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data: ' + error);
    }
 }


 function generateForm(entry = null, type = null) {
      formContainer.innerHTML = ''; // Clear existing form
      const form = document.createElement('form');
      form.id = 'dataForm';
      let schema;
    if(entry && entry.group){
       schema = (entry.group === 'class' ? {
               "id": {type: "text", label: "ID", required:true},
             "label": { type: "text", label: "Label", required: true },
              "group": { type: "select", label: "Group", options: ['class', 'instance'], required:true },
                "features": { type: "array", label: "Features" },
             "specifications": { type: "object", label: "Specifications" },
                "valueProposition": { type: "textarea", label: "Value Proposition"}

        } : {
            "id": { type: "text", label: "ID", required:true},
           "label": { type: "text", label: "Label", required: true },
            "group": { type: "select", label: "Group", options: ['class', 'instance'], required:true },
            "class":{type: 'select', label: "Class", options: currentData.nodes.filter(n => n.group == 'class').map(n => n.id), required: true},
            "hidden": { type: "checkbox", label: "Hidden"},
             "specifications": { type: "object", label: "Specifications" },
            "valueProposition": { type: "textarea", label: "Value Proposition"}
        })
   } else if (type === 'class'){
        schema = {
             "id": {type: "text", label: "ID", required:true},
            "label": { type: "text", label: "Label", required: true },
             "group": { type: "select", label: "Group", options: ['class', 'instance'], required:true },
              "features": { type: "array", label: "Features" },
            "specifications": { type: "object", label: "Specifications" },
            "valueProposition": { type: "textarea", label: "Value Proposition"}
         }
   }   else if (type === 'instance'){
       schema = {
            "id": { type: "text", label: "ID", required:true},
           "label": { type: "text", label: "Label", required: true },
            "group": { type: "select", label: "Group", options: ['class', 'instance'], required:true },
             "class":{type: 'select', label: "Class", options: currentData.nodes.filter(n => n.group == 'class').map(n => n.id), required: true},
            "hidden": { type: "checkbox", label: "Hidden"},
             "specifications": { type: "object", label: "Specifications" },
            "valueProposition": { type: "textarea", label: "Value Proposition"}
         }
   } else { // edge
        schema =  {
            "from": { type: "select", label: "From", options: currentData.nodes.map(n => n.id), required:true },
            "to": { type: "select", label: "To", options: currentData.nodes.map(n => n.id), required:true },
            "label": { type: "text", label: "Label", required: true }
        };
    }


     for (const key in schema) {
       if (schema.hasOwnProperty(key)) {
             const { type, label, options, required} = schema[key];

             const formGroup = document.createElement('div');
            const labelElement = document.createElement('label');
            labelElement.textContent = label;
            formGroup.appendChild(labelElement);

           let inputElement;

            switch (type) {
                  case 'text':
                         inputElement = document.createElement('input');
                          inputElement.type = 'text';
                         if(entry) inputElement.value = entry[key] || "";
                         break;
                  case 'textarea':
                         inputElement = document.createElement('textarea');
                        if(entry) inputElement.value = entry[key] || "";
                        break;
                   case 'select':
                        inputElement = document.createElement('select');
                        if(options){
                            options.forEach(option => {
                                const optionElement = document.createElement('option');
                                 optionElement.value = option;
                                 optionElement.textContent = option;
                                 inputElement.appendChild(optionElement);
                            });
                             if(entry) inputElement.value = entry[key] || "";
                         }
                         break;
                case 'checkbox':
                       inputElement = document.createElement('input');
                         inputElement.type = 'checkbox';
                        if(entry && entry[key]) inputElement.checked = entry[key];
                         break;
                 case 'array':
                      inputElement = document.createElement('textarea');
                      if(entry && entry[key]) inputElement.value = entry[key].join(', ');
                      break;
                 case 'object':
                      inputElement = document.createElement('textarea');
                      if(entry && entry[key]) inputElement.value = JSON.stringify(entry[key], null, 2);
                     break;

                  default:
                       inputElement = document.createElement('input');
                        inputElement.type = 'text';
                      if(entry) inputElement.value = entry[key] || "";
                        break;
            }

            inputElement.id = key;
            if(required){
               inputElement.required = true;
             }
             formGroup.appendChild(inputElement);
           form.appendChild(formGroup);
        }
     }
     const submitBtn = document.createElement('button');
       submitBtn.textContent = entry ? "Update Entry" : "Create Entry";
     submitBtn.addEventListener('click', function(event){
         event.preventDefault();
         submitForm(entry);
      })
     form.appendChild(submitBtn);
       formContainer.appendChild(form);
 }


 async function submitForm(entry = null) {
     const form = document.getElementById('dataForm');
     const formData = {};

     for(const element of form.elements){
       if(element.id){
             if(element.type === 'checkbox'){
                 formData[element.id] = element.checked;
            } else if(element.type === 'select'){
                  formData[element.id] = element.value
             } else if (element.type === 'textarea'){
                  try {
                       if (form[element.id] && form[element.id].value.length > 0) {
                           if (element.id === 'features') {
                                formData[element.id] = form[element.id].value.split(',').map(item => item.trim());
                           } else if (element.id === 'specifications'){
                                formData[element.id] = JSON.parse(form[element.id].value)
                            } else {
                               formData[element.id] = form[element.id].value;
                           }
                       }
                 } catch(error){
                      alert('Error parsing object: ' + error);
                     return
                    }
            } else {
               formData[element.id] = element.value;
           }
       }
     }

     if(entry){
           if(entry.group === 'class'){
                currentData.nodes[currentEntryIndex] = {...currentData.nodes[currentEntryIndex], ...formData}
           } else {
                currentData.nodes[currentEntryIndex] = {...currentData.nodes[currentEntryIndex], ...formData}
           }
      } else {
          if(formData.from){ // edge
               currentData.edges.push(formData);
           }
          else { //node
               currentData.nodes.push(formData);
          }
     }
     renderTable()
     generateForm()
}


 async function renderTable() {
     tableContainer.innerHTML = ''; // Clear existing table

      const table = document.createElement('table');
      const headerRow = document.createElement('tr');
       const headerCells = ['Type', 'id', 'label'];


      for(const h of headerCells){
            const th = document.createElement('th');
          th.textContent = h
          headerRow.appendChild(th);
      }

     table.appendChild(headerRow);

      currentData.nodes.forEach((entry, index) => {
         const row = document.createElement('tr');
         const nodeType = document.createElement('td');
           nodeType.textContent = entry.group
           row.appendChild(nodeType);

          const id = document.createElement('td');
           id.textContent = entry.id;
          row.appendChild(id);

         const label = document.createElement('td');
           label.textContent = entry.label;
          row.appendChild(label);

         const edit = document.createElement('button');
         edit.textContent = 'Edit';
           edit.addEventListener('click', () => {
              currentEntryIndex = index
              generateForm(entry)
          });
         row.appendChild(edit);

        const del = document.createElement('button');
         del.textContent = 'Delete'
         del.addEventListener('click', () => {
            currentData.nodes.splice(index, 1);
              renderTable()
              generateForm()
         })
        row.appendChild(del);

        table.appendChild(row);
     });


    currentData.edges.forEach((entry, index) => {
          const row = document.createElement('tr');
           const nodeType = document.createElement('td');
           nodeType.textContent = 'edge'
           row.appendChild(nodeType);

            const id = document.createElement('td');
           id.textContent = `${entry.from} - ${entry.to}`;
            row.appendChild(id);

            const label = document.createElement('td');
            label.textContent = entry.label;
           row.appendChild(label);

          const edit = document.createElement('button');
          edit.textContent = 'Edit';
           edit.addEventListener('click', () => {
               currentEntryIndex = index
                 generateForm(entry)
          });
           row.appendChild(edit);

         const del = document.createElement('button');
          del.textContent = 'Delete'
          del.addEventListener('click', () => {
               currentData.edges.splice(index, 1);
              renderTable()
              generateForm()
           })
         row.appendChild(del);
          table.appendChild(row);
    });
     tableContainer.appendChild(table);
 }

 function addEntry(type = null){
     generateForm(null, type);
     currentEntryIndex = null;
 }

 async function initializeEditor() {
      currentData = await fetchOntologyData()
     renderTable();
     generateForm()
}
 initializeEditor();