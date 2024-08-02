
// Function to load room numbers into the dropdown
function loadRoomNumbers() {
    fetch('/get-room-numbers')
        .then(response => response.json())
        .then(roomNumbers => {
            console.log('Room numbers received:', roomNumbers); // Debugging line
            if (!Array.isArray(roomNumbers)) {
                throw new TypeError('Expected an array of room numbers');
            }
            const roomNumberSelect = document.getElementById('roomNumber');
            roomNumberSelect.innerHTML = ''; // Clear existing options
            roomNumbers.forEach(number => {
                const option = document.createElement('option');
                option.value = number;
                option.textContent = number;
                roomNumberSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading room numbers:', error);
        });
}


// Load room numbers on page load
window.onload = function () {
    loadRoomNumbers();
    loadRecords(); // Ensure this is called after loadRoomNumbers if needed
};

// Toggle visibility of records
const dataHeading = document.getElementById('data-heading');
const dataContainerS = document.getElementById('data-containerS');
const toggleIndicator = document.getElementById('toggle-indicator');

dataHeading.addEventListener('click', function () {
    if (dataContainerS.style.display === 'none') {
        dataContainerS.style.display = 'block';
        toggleIndicator.textContent = '▼'; // Up arrow when expanded
    } else {
        dataContainerS.style.display = 'none';
        toggleIndicator.textContent = '▶'; // Down arrow when collapsed
    }
});

// Get modal elements
const modal = document.getElementById('myModal');
const span = document.getElementsByClassName('close')[0];
const modalMessage = document.getElementById('modalMessage');

// Function to show the modal with a message
function showModal(message) {
    modalMessage.textContent = message;
    modal.style.display = 'block';
}

// Close the modal when the user clicks on <span> (x)
span.onclick = function() {
    modal.style.display = 'none';
}

// Close the modal when the user clicks anywhere outside of the modal
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Add new record
document.getElementById('scheduleForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Get values from the form
    const courseCodeElem = document.getElementById('courseCode');
    const batchElem = document.getElementById('batch');
    const labNumberElem = document.getElementById('labNumber');
    const labNoElem = document.getElementById('roomNumber');
    const startTimeElem = document.getElementById('startTime');
    const endTimeElem = document.getElementById('endTime');
    console.log(courseCodeElem,batchElem,labNumberElem,labNoElem,startTimeElem,endTimeElem);
    if (!courseCodeElem || !batchElem || !labNumberElem || !labNoElem || !startTimeElem || !endTimeElem) {
        console.error('One or more form elements are missing.');
        return;
    }

    const courseCode = courseCodeElem.value;
    const batch = batchElem.value;
    let labNumber = labNumberElem.value;
    const labNo = labNoElem.value;
    const startTime = new Date(startTimeElem.value).toISOString();
    const endTime = new Date(endTimeElem.value).toISOString();

    if (labNumber.length === 1) {
        labNumber = '0' + labNumber;
    }
    const labID = courseCode + '-' + batch + '-' + labNumber;
    const record = {
        labID,
        labNo,
        startTime,
        endTime
    };

    fetch('/add-schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === 'Record added successfully!') {
            loadRecords();
            document.getElementById('scheduleForm').reset();
            showModal('Record added successfully!');
        } else {
            console.error('Failed to add record:', result.message);
            showModal('Failed to add record: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error adding record:', error);
        showModal('Error adding record: ' + error.message);
    });
});


// Load records from the server
function loadRecords() {
    fetch('/get-records')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(records => {
            const dataContainerS = document.getElementById('data-containerS');
            dataContainerS.innerHTML = '';

            if (records.length > 0) {
                // Create headings
                const headings = document.createElement('div');
                headings.classList.add('data-entry', 'headings');
                headings.innerHTML = `
                        <span>Sr. No</span>
                        <span>Lab ID</span>
                        <span>Room Number</span>
                        <span>Start Time</span>
                        <span>End Time</span>
                    `;
                dataContainerS.appendChild(headings);

                // Populate records
                records.forEach((record, index) => {
                    const entry = document.createElement('div');
                    entry.classList.add('data-entry', 'record');
                    entry.innerHTML = `
                            <span>${index + 1}</span>
                            <span>${record.labID}</span>
                            <span>${record.labNo}</span>
                            <span>${new Date(record.startTime).toLocaleString()}</span>
                            <span>${new Date(record.endTime).toLocaleString()}</span>
                        `;
                    dataContainerS.appendChild(entry);
                });
            } else {
                dataContainerS.innerHTML = '<div>No records found</div>';
            }
        })
        .catch(error => {
            console.error('Error loading records:', error);
        });
}

// Load records on page load
window.onload = function () {
    loadRoomNumbers();
    loadRecords();
};

