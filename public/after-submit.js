let baseUrl;

async function loadConfig() {
    try {
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Failed to load config');
        const config = await response.json();
        baseUrl = config.baseUrl;
        console.log('Loaded baseUrl:', baseUrl);
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Ensure the config is loaded before executing anything else
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig(); // Load config before making any API calls

    const urlParams = new URLSearchParams(window.location.search);
    const snipId = urlParams.get('snip_id');

    if (snipId) {
        await loadSnipData(snipId);
        await loadComments(snipId);
    }
});

// Function to load snip data and display code, title, language, and tags
async function loadSnipData(snipId) {
    try {
        console.log('Using baseUrl:', baseUrl);
        const response = await fetch(`${baseUrl}/api/snips/${snipId}`);
        if (!response.ok) throw new Error(`Failed to fetch snip data: ${response.statusText}`);
        const data = await response.json();

        // Construct the full URL dynamically using the base URL and snip_id
        const fullUrl = `${baseUrl}/after_submit.html?snip_id=${snipId}`;
        const uniqueUrlElement = document.getElementById('uniqueUrl');
        if (uniqueUrlElement) {
            uniqueUrlElement.textContent = fullUrl;
        } else {
            console.error("Element with ID 'uniqueUrl' not found.");
        }

        // Display the title of the snip
        const codeTitleElement = document.getElementById('codeTitle');
        if (codeTitleElement) {
            codeTitleElement.textContent = data.title || 'No Title Provided';
        } else {
            console.error("Element with ID 'codeTitle' not found.");
        }

        // Ensure proper code formatting inside <pre>
        const codeDisplayElement = document.getElementById('codeDisplay');
        codeDisplayElement.innerHTML = ""; // Clear previous content

        const codeElement = document.createElement("code");
        codeElement.className = `language-${data.language || "plaintext"}`;
        codeElement.textContent = data.snip || "No Snip Content";
        codeDisplayElement.appendChild(codeElement);

        // Apply syntax highlighting
        hljs.highlightElement(codeElement);

        // Update language selection dropdown
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = data.language || "plaintext";
        }

        // Load and display the tags associated with the snip
        await loadTags(snipId);
    } catch (error) {
        console.error("Error loading snip data:", error);
    }
}




// Function to copy the URL to clipboard
async function copyUrl() {
    const uniqueUrlElement = document.getElementById('uniqueUrl');
    if (!uniqueUrlElement) {
        console.error("Element with ID 'uniqueUrl' not found.");
        return;
    }

    const url = uniqueUrlElement.textContent.trim();
    
    if (!url) {
        console.error("No URL found to copy.");
        alert("Nothing to copy!");
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            // Use Clipboard API if available
            await navigator.clipboard.writeText(url);
            alert("URL copied to clipboard!");
        } else {
            // Fallback method: create a temporary input field
            const tempInput = document.createElement("input");
            document.body.appendChild(tempInput);
            tempInput.value = url;
            tempInput.select();
            document.execCommand("copy"); // Deprecated but works as a fallback
            document.body.removeChild(tempInput);
            alert("URL copied to clipboard!");
        }
    } catch (error) {
        console.error("Error copying URL:", error);
        alert("Failed to copy URL.");
    }
}



// Function to load tags and display them under the URL section
async function loadTags(snipId) {
    try {
        const response = await fetch(`${baseUrl}/api/tags/${snipId}`);
        const tags = await response.json();
        const tagsList = document.getElementById('tagsList');
        tagsList.innerHTML = ''; // Clear existing tags

        if (tags.length === 0) {
            tagsList.innerHTML = '<p>No tags available</p>';
            return;
        }

        tags.forEach(tag => {
            const tagChip = document.createElement('div');
            tagChip.classList.add('tag-chip');
            tagChip.textContent = tag.tag_name;
            tagsList.appendChild(tagChip);
        });
    } catch (error) {
        console.error("Error loading tags:", error);
    }
}

// Function to load comments
function loadComments(snipId) {
    fetch(`/api/comments/${snipId}`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load comments");
            return response.json();
        })
        .then(comments => {
            const commentsContainer = document.getElementById("commentsContainer");
            commentsContainer.innerHTML = ""; // Clear previous comments

            comments.forEach(comment => {
                const commentElement = document.createElement("div");
                commentElement.classList.add("comment");

                // Comment text
                const commentText = document.createElement("span");
                commentText.textContent = `user: ${comment.comment}`;
                commentElement.appendChild(commentText);

                // Created At (date & time)
                const commentDate = document.createElement("span");
                commentDate.textContent = ` (${new Date(comment.created_at).toLocaleString()})`;
                commentDate.style.fontSize = "0.85em"; // Slightly smaller text
                commentDate.style.color = "#555"; // Subtle color
                commentElement.appendChild(commentDate);

                commentsContainer.appendChild(commentElement);
            });
        })
        .catch(error => {
            console.error("Error loading comments:", error);
        });
}


// Function to submit a new comment
async function submitComment() {
    const commentInput = document.getElementById('commentInput');
    const comment = commentInput.value.trim();
    const snipId = new URLSearchParams(window.location.search).get('snip_id');

    if (!comment) return;

    try {
        const response = await fetch(`${baseUrl}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ snip_id: snipId, comment })
        });

        if (response.ok) {
            commentInput.value = ''; // Clear the input field
            await loadComments(snipId); // Reload comments to show the new one
        } else {
            alert("Failed to submit comment.");
        }
    } catch (error) {
        console.error("Error submitting comment:", error);
    }
}

function applyHighlighting() {
    console.log("Applying syntax highlighting.");
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);  // Use highlightElement as recommended
    });
}



// Function to fetch the snip data from the server and display it
function loadSnip(snipId) {
    fetch(`${baseUrl}/api/snips/${snipId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            const codeDisplay = document.getElementById("codeDisplay");
            if (!codeDisplay) return;

            // Clear any existing content to avoid duplication
            codeDisplay.innerHTML = "";

            // Create a new <code> element with appropriate language class
            const codeElement = document.createElement("code");
            codeElement.className = "language-javascript"; // Default language
            codeElement.textContent = data.snip; // Use textContent to avoid HTML interpretation
            codeDisplay.appendChild(codeElement);

            applyHighlighting(); // Apply syntax highlighting after loading content
        })
        .catch(error => console.error("Error fetching snip:", error));
}

// Function to apply syntax highlighting using highlight.js
function applyHighlighting() {
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);  // Use highlightElement for syntax highlighting
    });
}

// Function to handle language selection change
function changeLanguage() {
    const languageSelect = document.getElementById("languageSelect");
    const selectedLanguage = languageSelect.value.toLowerCase();
    const codeDisplay = document.getElementById("codeDisplay");

    if (!codeDisplay) return;

    const codeElement = codeDisplay.querySelector("code");
    if (!codeElement) return;

    // Update the language class on the <code> element
    codeElement.className = `language-${selectedLanguage}`;

    applyHighlighting(); // Reapply syntax highlighting after changing language
}

// Event listener for DOM content loaded to fetch snip and set up the language selector
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const snipId = urlParams.get("snip_id");
    if (snipId) {
        loadSnip(snipId);
    }

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
        languageSelect.addEventListener("change", changeLanguage);
    }
});

// Function to export the code snippet
function exportCode() {
    const codeDisplay = document.getElementById("codeDisplay");
    if (!codeDisplay) {
        console.error("Code display element not found.");
        return;
    }

    const codeElement = codeDisplay.querySelector("code");
    if (!codeElement) {
        console.error("Code element inside codeDisplay not found.");
        return;
    }

    const codeContent = codeElement.textContent;
    if (!codeContent) {
        console.error("No code content found to export.");
        return;
    }

    const blob = new Blob([codeContent], { type: "text/plain;charset=utf-8" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "code_snippet.txt";
    downloadLink.click();
}


// Attach event listener to export button
document.getElementById("exportButton").addEventListener("click", exportCode);

// Function to toggle dark mode
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Apply the new theme
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save the preference to localStorage
    localStorage.setItem('theme', newTheme);

    // Update the button text or other UI elements if necessary
    document.getElementById('darkModeToggle').textContent = 
        newTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

// Function to load theme on page load
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('darkModeToggle').textContent = 
            savedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
}

// Add event listener for the dark mode toggle button
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

// Load the theme preference on page load
document.addEventListener('DOMContentLoaded', loadThemePreference);




document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const snipId = urlParams.get("snip_id");

    if (!snipId) {
        console.error("No snip ID provided in the URL.");
        return;
    }

    try {
        const response = await fetch(`/api/snip/${snipId}`);
        if (!response.ok) throw new Error("Failed to fetch snip data.");

        const snipData = await response.json();

        // Display attached files
        const attachedFilesContainer = document.getElementById("attachedFiles");
        if (snipData.image) {
            const img = document.createElement("img");
            img.src = `data:image/png;base64,${snipData.image}`; // Assuming PNG, adjust MIME type if necessary
            img.alt = "Attached Image";
            img.style.maxWidth = "100%";
            img.style.border = "1px solid #ccc";
            attachedFilesContainer.appendChild(img);
        } else {
            attachedFilesContainer.textContent = "No files attached.";
        }
    } catch (error) {
        console.error("Error fetching snip data:", error);
    }
});








