import dbClient from './utils/db.js'; // Adjusted path for the 'tests' directory

// Function to wait for MongoDB connection
const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            setTimeout(async () => {
                i += 1;
                if (i >= 10) {
                    reject(new Error("MongoDB connection timeout"));
                } else if (!dbClient.isAlive()) {
                    repeatFct();
                } else {
                    resolve();
                }
            }, 1000);
        };
        repeatFct();
    });
};

(async () => {
    console.log("Checking if MongoDB is alive:", dbClient.isAlive());
    await waitConnection();
    console.log("MongoDB is now connected:", dbClient.isAlive());

    // Fetch and print the number of users and files
    console.log("Number of users:", await dbClient.nbUsers());
    console.log("Number of files:", await dbClient.nbFiles());
})();
