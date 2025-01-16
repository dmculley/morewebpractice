 // Function to fetch ontology data
 async function fetchOntologyData() {
    try {
       const response = await fetch('ontology_data.json');
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
       return await response.json();
    } catch (error) {
        console.error('Error fetching ontology data:', error);
       return { nodes: [], edges: [] };
    }
}

// Vis.js setup and event handlers
async function initializeApp() {
   const ontology = await fetchOntologyData();

     // Options for the vis.js network
    const options = {
        physics: {
             enabled: true,
            barnesHut: {
                gravitationalConstant: -6000,
                centralGravity: 0.2,
                 springLength: 100,
                 springConstant: 0.04
            },
            stabilization: { iterations: 200 }
        },
        edges: {
             arrows: 'to',
             smooth: false,
             color: 'black',
            font: {
               color: 'black',
                background: 'white',
                padding: 5
            },
           labelHighlightBold: false
        },
       nodes: {
            shape: 'box',
            shapeProperties: {
               borderRadius: 6
            },
            font: {
               color: 'white'
            }
        },
        groups: {
            class: {
                color: {
                   background: '#001f3f',
                    border: '#001f3f'
               }
            },
           instance: {
                color: {
                   background: '#add8e6',
                    border: '#add8e6'
               },
                font: {
                   color: 'black'
                }
           }
        }
    };

    // Vis.js data setup
    const data = {
       nodes: new vis.DataSet(ontology.nodes),
       edges: new vis.DataSet(ontology.edges),
    };


     // Initialize the network
    const container = document.getElementById("mynetwork");
   const network = new vis.Network(container, data, options);


   // Set initial position for Offers node
    network.on('afterDrawing', function () {
        const offerNode = data.nodes.get('Offers');
        if (offerNode) {
            const canvas = container.querySelector('canvas');
            const canvasRect = canvas.getBoundingClientRect();
            const x = -canvasRect.width / 100;
            const y = -200;
           data.nodes.update({ id: 'Offers', x: x, y: y });
        }
    });


   let selectedNode = null;

    // Node click event handler
    network.on("click", function (params) {
        if (params.nodes.length === 1) {
           const nodeId = params.nodes[0];
            const node = data.nodes.get(nodeId);


            //check for double clicks on the same node
            if(selectedNode == nodeId){
               selectedNode = null;
               //handle collapsing of nodes
               toggleInstances(node);
            } else {
               selectedNode = nodeId;
                displayNodeInfo(node);
                toggleInstances(node)
           }


       } else {
            //hide selected feature and reset style if no node selected
            selectedNode = null;
           displayDefaultInfo();
        }
    });

    function toggleInstances(node) {
        if (node.group === 'class') {
            const instances = ontology.nodes.filter(n => n.class === node.id);
           const newEdges = [];


            instances.forEach(instance => {
               // Toggle visibility of the instance node
               instance.hidden = !instance.hidden;
                data.nodes.update(instance);


                // Create an edge if instance is being shown, remove if being hidden.
               if(!instance.hidden){
                    newEdges.push({from: node.id, to: instance.id})
              } else {
                    const edgeToRemove = data.edges.getIds().find(edgeId => {
                       const edge = data.edges.get(edgeId);
                       return edge.from === node.id && edge.to === instance.id
                    });
                    if(edgeToRemove)
                        data.edges.remove(edgeToRemove);
               }
            });
            //add the new edges
           data.edges.add(newEdges);
       }
    }


    // Function to display node info in sidebar
    function displayNodeInfo(node) {
        const featureList = document.getElementById('featureList');
        featureList.innerHTML = '';

        if(node) {
            // Display Node Title
           const title = document.createElement('h2');
            title.textContent = node.label;
             featureList.appendChild(title);

            // Display Features List
            if(node.features && node.features.length > 0){
                 const featuresHeading = document.createElement('h3');
                featuresHeading.textContent = 'Features';
               featureList.appendChild(featuresHeading);
                const featuresList = document.createElement('ul');
                node.features.forEach(feature => {
                   const li = document.createElement('li');
                    li.textContent = feature;
                   featuresList.appendChild(li);
                });
               featureList.appendChild(featuresList);
            }

            // Display Specifications Table
           if (node.specifications && Object.keys(node.specifications).length > 0) {
                const specHeading = document.createElement('h3');
               specHeading.textContent = 'Specifications';
                featureList.appendChild(specHeading);

               const table = document.createElement('table');
                const tbody = document.createElement('tbody');
                for (const key in node.specifications) {
                   if (node.specifications.hasOwnProperty(key)) {
                        const row = document.createElement('tr');
                        const optionCell = document.createElement('td');
                       optionCell.textContent = key;
                        const valueCell = document.createElement('td');
                        valueCell.textContent = node.specifications[key];
                        row.appendChild(optionCell);
                       row.appendChild(valueCell);
                        tbody.appendChild(row);
                    }
                }
                table.appendChild(tbody);
               featureList.appendChild(table);
            }

             //Display value proposition
            if(node.valueProposition){
                const valuePropositionHeading = document.createElement('h3');
                valuePropositionHeading.textContent = 'Value Proposition';
                featureList.appendChild(valuePropositionHeading)
               const valuePropositionText = document.createElement('p');
                valuePropositionText.textContent = node.valueProposition;
               featureList.appendChild(valuePropositionText);
           }

       } else {
           displayDefaultInfo()
       }
    }

     // Function to display default info when no node is selected
    function displayDefaultInfo(){
        const featureList = document.getElementById('featureList');
       featureList.innerHTML = '';

       const title = document.createElement('h2');
        title.textContent = "Product Ontology";
         featureList.appendChild(title);

        const description = document.createElement('p');
       description.textContent = "This is a visualisation of our product ontology, it helps you understand how our offers, solutions and product lines fit together. Click on a class node to see more detail.";
       featureList.appendChild(description);
    }
    displayDefaultInfo();
}


initializeApp();