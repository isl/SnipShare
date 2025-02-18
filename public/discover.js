let baseUrl ;

// Load the base URL from config.json using Promises
async function loadConfig() {
    try {
        const response = await fetch('/config.json'); // Ensure this file is accessible
        if (!response.ok) throw new Error('Failed to load config');
        const config = await response.json();
        baseUrl = config.baseUrl;
        console.log('Loaded baseUrl:', baseUrl);
    } catch (error) {
        console.error('Error loading config:', error);
    }
}


// Call loadConfig and then fetchSnips after the config is loaded
document.addEventListener("DOMContentLoaded", () => {
    loadConfig().then(() => {
        fetchSnips(); // Call fetchSnips after baseUrl is set
    }).catch(error => {
        console.error('Error loading configuration:', error);
    });
});


function fetchSnips() {
    console.log('Using baseUrl:', baseUrl);
    fetch(`${baseUrl}/api/discover-snips`)
        .then(response => response.json())
        .then(data => {
            const snipsGrid = document.getElementById("snipsGrid");
            snipsGrid.innerHTML = "";  // Clear the grid before adding snips

            data.forEach(snip => {
                const snipCard = document.createElement("div");
                snipCard.className = "snip-card";
                snipCard.onclick = () => redirectToSnip(snip.snip_id);

                // Title
                const titleElement = document.createElement("h2");
                titleElement.textContent = snip.title;
                snipCard.appendChild(titleElement);

                // Code preview
                const previewElement = document.createElement("p");
                previewElement.textContent = snip.preview + "..."; // Append ellipsis
                snipCard.appendChild(previewElement);

                // Tags
                const tagsContainer = document.createElement("div");
                snip.tags.forEach(tag => {
                    const tagElement = document.createElement("span");
                    tagElement.className = "tag";
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
                snipCard.appendChild(tagsContainer);

                snipsGrid.appendChild(snipCard);
            });
        })
        .catch(error => console.error("Error fetching snips:", error));
}

function redirectToSnip(snipId) {
    window.location.href = `after_submit.html?snip_id=${snipId}`;
}
// Function to fetch snips based on a title search
// Assuming the search bar triggers this function on submit
// Function to render snips to the container
function renderSnips(snips) { 
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (snips.length === 0) {
        resultsContainer.innerHTML = '<p>No snips found.</p>';
        return;
    }

    snips.forEach(snip => {
        const snipCard = document.createElement('div');
        snipCard.classList.add('snip-card');

        // Add title
        const titleElement = document.createElement('h2');
        titleElement.textContent = snip.title;
        snipCard.appendChild(titleElement);

        // Add snip content preview
        const snipContent = document.createElement('p');
        snipContent.textContent = snip.snip.slice(0, 100) + '...'; // Limit preview length
        snipCard.appendChild(snipContent);

        // Add tags
        if (snip.tags) {
            const tagsContainer = document.createElement('div');
            tagsContainer.classList.add('tags-container');
            const tags = snip.tags.split(','); // Split tags into an array
            tags.forEach(tag => {
                const tagChip = document.createElement('span');
                tagChip.classList.add('tag-chip');
                tagChip.textContent = tag.trim();
                tagsContainer.appendChild(tagChip);
            });
            snipCard.appendChild(tagsContainer);
        }

        // Add click event for navigation
        snipCard.addEventListener('click', () => {
            window.location.href = `after_submit.html?snip_id=${snip.snip_id}`;
        });

        resultsContainer.appendChild(snipCard);
    });
}





// Function to search snips based on title or tags
function searchSnips() {
    const searchQuery = document.getElementById('searchInput').value.trim();

    if (!searchQuery) {
        alert('Please enter a title or tag to search!');
        return;
    }

    // Fetch snips based on the search query (title or tag)
    fetch(`/api/search-snips?query=${encodeURIComponent(searchQuery)}`)
        .then(response => {
            if (!response.ok) throw new Error('Error fetching snips');
            return response.json();
        })
        .then(snips => {
            renderSnips(snips); // Call renderSnips with the fetched data
        })
        .catch(error => {
            console.error('Error fetching snips:', error);
            alert('Failed to fetch snips. Please try again.');
        });
}


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
