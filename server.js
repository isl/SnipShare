const { baseUrl } = require('./config');

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');


const upload = multer(); // Middleware to handle `multipart/form-data`

const app = express();
const PORT = 3000;  // Set the web server to run on port 3000
const cors = require('cors');
app.use(cors());
app.use('/snipshare', express.static(path.join(__dirname, 'public')));
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS) from the "public" directory
app.use(express.static('public'));
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline'");
    next();
});

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Giorgos13!',
    database: 'snip',
    port: 3306  // This is the MySQL port
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Endpoint to submit snip with tags
// Route to handle submitting a snip with tags
app.post('/submit-snip-with-tags', upload.single('image'), (req, res) => {
    const { title, snip, language, tags } = req.body; // Get language from the request
    const image = req.file; // Multer handles the uploaded file

    // Debugging: Log the received data
    console.log("Request received for new snip:");
    console.log("Title:", title);
    console.log("Snip:", snip);
    console.log("Language:", language); // Debug the language value
    console.log("Tags:", tags);
    console.log("Image provided:", !!image);

    // Ensure tags are parsed correctly
    let parsedTags;
    try {
        parsedTags = JSON.parse(tags || '[]');
    } catch (error) {
        console.error("Error parsing tags:", error);
        return res.status(400).send("Invalid tags format.");
    }

    console.log("Parsed Tags:", parsedTags);

    // Insert the snip into the Snip table
    const insertSnipQuery = 'INSERT INTO Snip (title, snip, language, created_at) VALUES (?, ?, ?, NOW())';
    console.log("Executing query:", insertSnipQuery, [title, snip, language]);
    db.query(insertSnipQuery, [title, snip, language], (err, result) => {
        if (err) {
            console.error('Error inserting snip:', err);
            return res.status(500).send('Error inserting snip');
        }

        const snipId = result.insertId;
        console.log("Snip inserted with ID:", snipId);

        // Handle tags insertion
        const insertTagPromises = parsedTags.map(tag => {
            return new Promise((resolve, reject) => {
                const checkTagQuery = 'SELECT tag_id FROM Tags WHERE tag_name = ?';
                db.query(checkTagQuery, [tag], (err, results) => {
                    if (err) return reject(err);

                    if (results.length === 0) {
                        const insertTagQuery = 'INSERT INTO Tags (tag_name) VALUES (?)';
                        db.query(insertTagQuery, [tag], (err, tagResult) => {
                            if (err) return reject(err);
                            const tagId = tagResult.insertId;

                            const insertSnipTagQuery = 'INSERT INTO SnipTag (snip_id, tag_id) VALUES (?, ?)';
                            db.query(insertSnipTagQuery, [snipId, tagId], (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                    } else {
                        const tagId = results[0].tag_id;
                        const insertSnipTagQuery = 'INSERT INTO SnipTag (snip_id, tag_id) VALUES (?, ?)';
                        db.query(insertSnipTagQuery, [snipId, tagId], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    }
                });
            });
        });

        // Insert image into the images table
        const insertImage = new Promise((resolve, reject) => {
            if (image) {
                console.log("Inserting image into database...");
                const insertImageQuery = 'INSERT INTO images (snip_id, image_data) VALUES (?, ?)';
                db.query(insertImageQuery, [snipId, image.buffer], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            } else {
                console.log("No image provided, skipping image insertion.");
                resolve(); // No image to insert
            }
        });

        Promise.all([...insertTagPromises, insertImage])
            .then(() => {
                console.log("Snip, tags, and image successfully inserted.");
                res.status(200).json({ snip_id: snipId });
            })
            .catch(error => {
                console.error('Error inserting tags or image:', error);
                res.status(500).send('Error inserting tags or image');
            });
    });
});



app.get('/api/snip/:id', (req, res) => {
    const snipId = req.params.id;

    const query = `
       SELECT 
        s.title, 
        s.snip, 
        s.language, 
        GROUP_CONCAT(t.tag_name) AS tags, 
        ANY_VALUE(i.image_data) AS image_data
    FROM Snip s
    LEFT JOIN SnipTag st ON s.snip_id = st.snip_id
    LEFT JOIN Tags t ON st.tag_id = t.tag_id
    LEFT JOIN images i ON s.snip_id = i.snip_id
    WHERE s.snip_id = ?
    GROUP BY s.snip_id;
    `;

    db.query(query, [snipId], (err, results) => {
        if (err) {
            console.error('Error fetching snip:', err);
            res.status(500).send('Error fetching snip');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Snip not found');
            return;
        }

        const snip = results[0];
        res.json({
            title: snip.title,
            snip: snip.snip,
            language: snip.language, // Include language in the response
            tags: snip.tags ? snip.tags.split(',') : [],
            image: snip.image_data ? snip.image_data.toString('base64') : null, // Send image as base64
        });
    });
});






// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at ${baseUrl}`);
});


// Endpoint to get all tags
app.get('/api/tags', (req, res) => {
    const query = 'SELECT * FROM Tags';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching tags:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.status(200).json(results);
        }
    });
});

// Get specific snip by ID
app.get('/api/snips/:snip_id', (req, res) => {
    const { snip_id } = req.params;
    const query = 'SELECT * FROM Snip WHERE snip_id = ?';
    db.query(query, [snip_id], (err, results) => {
        if (err) {
            console.error("Error fetching snip:", err);
            res.status(500).send('Error fetching snip');
        } else {
            res.json(results[0]);
        }
    });
});

// Get comments for specific snip
app.get('/api/comments/:snip_id', (req, res) => {
    const snipId = req.params.snip_id;

    const query = `SELECT comment, created_at FROM Comments WHERE snip_id = ? ORDER BY created_at DESC`;

    db.query(query, [snipId], (err, results) => {
        if (err) {
            console.error("Error fetching comments:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.status(200).json(results);
        }
    });
});


// Post a new comment
app.post('/api/comments', (req, res) => {
    const { snip_id, comment } = req.body;
    const query = 'INSERT INTO Comments (snip_id, comment) VALUES (?, ?)';
    db.query(query, [snip_id, comment], (err, result) => {
        if (err) {
            console.error("Error adding comment:", err);
            res.status(500).send('Error adding comment');
        } else {
            res.status(200).send('Comment added successfully');
        }
    });
});

// Get tags for a specific snip by ID
app.get('/api/snips/:snip_id/tags', (req, res) => {
    const { snip_id } = req.params;
    const query = `
        SELECT Tags.tag_name
        FROM Tags
        JOIN SnipTag ON Tags.tag_id = SnipTag.tag_id
        WHERE SnipTag.snip_id = ?`;

    db.query(query, [snip_id], (err, results) => {
        if (err) {
            console.error("Error fetching tags:", err);
            res.status(500).send('Error fetching tags');
        } else {
            res.json(results);
        }
    });
});
// Endpoint to get tags for a specific snip by snip_id
app.get('/api/tags/:snip_id', (req, res) => {
    const { snip_id } = req.params;
    const query = `
        SELECT t.tag_name
        FROM Tags t
        JOIN SnipTag st ON t.tag_id = st.tag_id
        WHERE st.snip_id = ?`;
    
    db.query(query, [snip_id], (err, results) => {
        if (err) {
            console.error("Error fetching tags:", err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.status(200).json(results);
        }
    });
});

// Endpoint to get all snips with a preview and tags
app.get('/api/discover-snips', (req, res) => {
    const query = `
        SELECT Snip.snip_id, Snip.title, Snip.snip, GROUP_CONCAT(Tags.tag_name) AS tags
        FROM Snip
        LEFT JOIN SnipTag ON Snip.snip_id = SnipTag.snip_id
        LEFT JOIN Tags ON SnipTag.tag_id = Tags.tag_id
        GROUP BY Snip.snip_id, Snip.title, Snip.snip
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching snips:", err);
            res.status(500).send('Error fetching snips');
        } else {
            // Send only the first 100 characters of each snip for preview
            const previewResults = results.map(snip => ({
                snip_id: snip.snip_id,
                title: snip.title,
                preview: snip.snip.substring(0, 100),  // Limit preview to 100 characters
                tags: snip.tags ? snip.tags.split(',') : []
            }));
            res.status(200).json(previewResults);
        }
    });
});

// Endpoint to search snips by title or tags
app.get('/api/search-snips', (req, res) => {
    const { query } = req.query;

    // Search for snips where the title or tag matches the query
    const searchQuery = `
        SELECT s.snip_id, s.title, s.snip, GROUP_CONCAT(t.tag_name) AS tags
        FROM Snip s
        LEFT JOIN SnipTag st ON s.snip_id = st.snip_id
        LEFT JOIN Tags t ON st.tag_id = t.tag_id
        WHERE s.title LIKE ? OR t.tag_name LIKE ?
        GROUP BY s.snip_id
    `;

    db.query(searchQuery, [`%${query}%`, `%${query}%`], (err, results) => {
        if (err) {
            console.error("Error fetching snips:", err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.status(200).json(results);
        }
    });
});


// Endpoint to search tags based on query
app.get('/api/tags/search', (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: "Query parameter is missing" });
    }

    const searchQuery = `SELECT * FROM Tags WHERE tag_name LIKE ? LIMIT 10`;
    db.query(searchQuery, [`${query}%`], (err, results) => {
        if (err) {
            console.error('Error fetching tags:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

