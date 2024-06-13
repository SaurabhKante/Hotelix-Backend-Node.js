module.exports ={
    isBefore24Hours:function (dateStr){
        const providedDate = new Date(dateStr);
        const currentDateTime = new Date();
        const thresholdDateTime = new Date(currentDateTime - 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        return providedDate < thresholdDateTime;
      },
      convertISOToIST:function(isoDate) {
        // Create a Date object from the ISO string
        const utcDate = new Date(isoDate);
      
        // Add 5 hours and 30 minutes to the UTC date
        utcDate.setHours(utcDate.getHours() + 5);
        utcDate.setMinutes(utcDate.getMinutes() + 30);
      
        // Manually format the date components
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0"); // Month is 0-based, so we add 1
        const day = utcDate.getUTCDate().toString().padStart(2, "0");
        const hours = utcDate.getUTCHours().toString().padStart(2, "0");
        const minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
        const seconds = utcDate.getUTCSeconds().toString().padStart(2, "0");
      
        // Create the IST date string in ISO-like format
        const istDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      
        return istDate;
      }
      
}