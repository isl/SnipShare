let baseUrl = 'http://192.168.1.101:3000';

// Load the base URL from config.json using Promises
function loadConfig() {
    return fetch('config.json')
        .then(response => {
            if (!response.ok) throw new Error(`Error loading config: ${response.statusText}`);
            return response.json();
        })
        .then(config => {
            baseUrl = config.baseUrl;
            console.log('Loaded baseUrl:', baseUrl);
        })
        .catch(error => {
            console.error('Error loading config:', error);
        });
}

// Function to handle the form submission
async function submitSnip() {
    const title = document.getElementById('titleInput').value;
    const snip = document.getElementById('codeInput').value;
    const language = document.getElementById('languageSelect').value; // Get the selected language
    const tags = Array.from(document.querySelectorAll('.tag-chip')).map(tagChip =>
        tagChip.childNodes[0].nodeValue.trim()
    );

    const imageInput = document.getElementById('imageInput');
    const imageFile = imageInput.files[0]; // Get the uploaded file

    if (!title || !snip) {
        alert("Title and code are required!");
        console.error("Title or code is missing. Title:", title, "Code:", snip);
        return;
    }

    try {
        console.log("Collected data:");
        console.log("Title:", title);
        console.log("Snip:", snip);
        console.log("Language selected:", language); // Debug the selected language
        console.log("Tags:", tags);
        console.log("Image file provided:", !!imageFile);

        // Prepare form data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('snip', snip);
        formData.append('language', language); // Include the language
        formData.append('tags', JSON.stringify(tags)); // Tags sent as JSON
        if (imageFile) {
            formData.append('image', imageFile); // Attach the image if provided
        }

        console.log("Form data prepared, submitting...");

        const response = await fetch(`${baseUrl}/submit-snip-with-tags`, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Snip created successfully:', result);
            console.log('Redirecting to after_submit.html with snip ID:', result.snip_id);

            // Redirect to after_submit.html with the snip_id as a query parameter
            window.location.href = `after_submit.html?snip_id=${result.snip_id}`;
        } else {
            const errorText = await response.text();
            console.error('Error response from server:', errorText);
            alert(`Error submitting snip: ${errorText}`);
        }
    } catch (error) {
        console.error('Error submitting snip:', error);
    }
}









document.addEventListener("DOMContentLoaded", function() {
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.addEventListener('click', (event) => {
            event.preventDefault();
            submitSnip();
        });
    } else {
        console.error("submitButton element not found.");
    }
});


// Function to fetch tags from the server
async function fetchTags() {
    try {
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
    }
}

// Function to display suggestions based on input
function displaySuggestions(tags, inputValue) {
    const suggestionsContainer = document.getElementById('tagsSuggestions');
    suggestionsContainer.innerHTML = '';

    const filteredTags = tags.filter(tag => 
        tag.tag_name.toLowerCase().includes(inputValue.toLowerCase())
    );

    filteredTags.forEach(tag => {
        const suggestion = document.createElement('div');
        suggestion.textContent = tag.tag_name;
        suggestion.addEventListener('click', () => {
            document.getElementById('tagsInput').value = tag.tag_name;
            suggestionsContainer.innerHTML = '';
        });
        suggestionsContainer.appendChild(suggestion);
    });
}

// Function to add a tag chip when the "Add Tag" button is clicked
function addTag() {
    const tagsInput = document.getElementById('tagsInput');
    const tagsContainer = document.getElementById('tagsContainer');

    // Check if elements exist and get the input value
    if (!tagsInput || !tagsContainer) {
        console.error("tagsInput or tagsContainer element is missing.");
        return;
    }

    const inputValue = tagsInput.value.trim();

    // Validate input value and prevent duplicates
    if (inputValue === "") {
        alert("Tag cannot be empty.");
        return;
    }

    // Create a tag chip
    const tagChip = document.createElement('div');
    tagChip.classList.add('tag-chip');
    tagChip.textContent = inputValue;

    // Create a close button for the tag
    const closeButton = document.createElement('span');
    closeButton.textContent = ' X';
    closeButton.classList.add('close-btn');

    // Add event listener to remove the tag on click
    closeButton.onclick = () => {
        tagsContainer.removeChild(tagChip);
    };

    tagChip.appendChild(closeButton);
    tagsContainer.appendChild(tagChip); // Append tag to container

    tagsInput.value = ''; // Clear input field
    console.log(`Added tag: ${inputValue}`); // Log to confirm
}

// Function to fetch tag suggestions based on user input
function fetchTagSuggestions(query) {
    return fetch(`/api/tags/search?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching tag suggestions:', error);
            return [];
        });
}

// Function to display autocomplete suggestions
function showTagSuggestions(suggestions, inputElement) {
    const suggestionsContainer = document.getElementById("tagSuggestions");
    suggestionsContainer.innerHTML = ""; // Clear any existing suggestions

    suggestions.forEach(tag => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        suggestionItem.textContent = tag.tag_name;
        suggestionItem.onclick = () => {
            inputElement.value = tag.tag_name;
            suggestionsContainer.innerHTML = ""; // Clear suggestions after selection
        };
        suggestionsContainer.appendChild(suggestionItem);
    });
}
console.log("JavaScript Loaded");

// Add event listener to the tag input field
document.addEventListener("DOMContentLoaded", function() {
    console.log("JavaScript Loaded");

    // Add event listener to the tag input field
    const tagInput = document.getElementById("tagInput");
    if (tagInput) {
        tagInput.addEventListener("input", async function(event) {
            const query = event.target.value;
            if (query.length > 1) {  // Fetch suggestions after 2+ characters
                const suggestions = await fetchTagSuggestions(query);
                showTagSuggestions(suggestions, event.target);
            } else {
                document.getElementById("tagSuggestions").innerHTML = ""; // Clear suggestions for short input
            }
        });
    } else {
        console.error("tagInput element not found.");
    }

    // Dark mode toggle logic
    if (localStorage.getItem("theme") === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        document.getElementById("darkModeToggle").textContent = "Switch to Light Mode";
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        document.getElementById("darkModeToggle").textContent = "Switch to Dark Mode";
    }

    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", function() {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            if (currentTheme === "light") {
                document.documentElement.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
                this.textContent = "Switch to Light Mode";
            } else {
                document.documentElement.setAttribute("data-theme", "light");
                localStorage.setItem("theme", "light");
                this.textContent = "Switch to Dark Mode";
            }
        });
    } else {
        console.error("darkModeToggle element not found.");
    }

    // Submit button logic
    const submitButton = document.getElementById("submitButton");
    if (submitButton) {
        submitButton.addEventListener("click", (event) => {
            event.preventDefault();
            submitSnip();
        });
    } else {
        console.error("submitButton element not found.");
    }

    console.log("JavaScript Loaded Completed");
});


console.log("JavaScript Loaded");