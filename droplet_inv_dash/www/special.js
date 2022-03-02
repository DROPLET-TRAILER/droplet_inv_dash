get_todays_date();

frappe.ready(function () {
    function getRequest(url) {
        const xhttp = new XMLHttpRequest();
        //const url = "";
        xhttp.open("GET", url, true);
        xhttp.send();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status === 200) {
                    console.log(this.responseText);
                }
            }
        }
    }
    getRequest("/api/resource/BOM");
    getRequest("/api/resource/BOM/BOM-Trailer_Code-001");
});

function get_todays_date() {
    let current = document.getElementById("current");
    let today = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    current.innerHTML = "Today's Date: " + today.toLocaleDateString(undefined, options);
}