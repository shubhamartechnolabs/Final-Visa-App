

#  Project Setup Guide

This project contains a frontend** and a backend. Follow the steps below to set up and run everything locally.



## 1. Frontend Setup

1. Navigate to your frontend project folder.

2. Update the backend API URL in `app.js`:

  
   // app.js
   const backendUrl = "http://localhost:5000"; // Backend server URL
  





## 📌 2. Backend Setup

1. Navigate to the backend project directory:

   
   cd backend
   

2. Install all dependencies:

 
   npm install
  

3. Create a `.env` file in the backend root folder and add the following variables:

   
   PORT=5000
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   FRONT_END_URL=http://127.0.0.1:5501


 

4. Run the backend in development mode:


   npm run dev
 



## 📌 3. Run Commands

* Frontend Build Command


  npm run build


* Backend Dev Server Command

 
  npm run dev
 



## 📌 4. Testing the Backend

After starting the backend, open your browser and visit:


http://localhost:5000


✅ If backend is running correctly, you should see a response.

Then open your **frontend** at:

http://127.0.0.1:5501


## 📌 5. Project Notes

* Keep API keys secure in `.env` file.
* Make sure frontend & backend ports do not conflict.
* Update `backendUrl` in frontend when deploying to production.





