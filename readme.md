# Plant Analyzer

Plant Analyzer is a web application that allows users to upload an image of a plant and receive detailed information about it, including species identification, health status, care recommendations, and key characteristics. The application also provides an option to download the analysis as a PDF report.

## Features

* Upload a plant image for analysis
* Identify plant species
* Get plant health insights
* Receive care recommendations
* View plant characteristics
* Download the analysis as a PDF
* Simple and responsive user interface

## Tech Stack

* Node.js
* Express.js
* EJS (templating)
* HTML and CSS
* Google Gemini API
* Multer (file uploads)
* PDFKit (PDF generation)

## Project Structure

project/
│── public/        # Static assets
│── views/         # EJS templates
│── uploads/       # Temporary uploaded files
│── reports/       # Generated PDF files
│── app.js         # Main server file
│── package.json
│── .env           # Environment variables


## Setup Instructions

1. Clone the repository

```
git clone https://github.com/your-username/plant-analyzer.git
cd plant-analyzer
```

2. Install dependencies

npm install

3. Create a `.env` file in the root directory and add:

GEMINI_API_KEY=your_api_key_here
PORT=3000

4. Start the server

npm start

5. Open your browser and visit:

http://localhost:3000
```

## How It Works

* The user uploads an image of a plant
* The server processes the image and sends it to the Gemini API
* The API returns structured information about the plant
* The result is displayed on the UI
* The user can download the result as a PDF

## Future Improvements

* User authentication system
* Save previous analyses
* Improve PDF layout and styling
* Add loading states and better feedback
* Deploy the application

## Author
Naman Thakkar
