// let current_report = {};

let calendar = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

setInterval(update_timer_since_last_update, 60000);
let minElapsed = 0;

function set_ID_drop_down() {
    let numberOfJsonItems = current_report.length;
    let itemNames = new Array(numberOfJsonItems);
    let selectTagToAdd = document.createElement("select");
    selectTagToAdd.setAttribute("id", "dropDown");

    for (let i = 0; i < numberOfJsonItems; ++i) {
        let words = current_report[i].item.split(" ");
        itemNames[i] = words[0];
        //sort itemNames in order

        // let optionToAdd = document.createElement("option");
        // optionToAdd.innerHTML = itemNames[i];
        // optionToAdd.setAttribute("value", "#row" + i);
        // optionToAdd.setAttribute("index", i);
        // selectTagToAdd.appendChild(optionToAdd);
    }

    let sortedArray = [...itemNames];
    sortedArray = sortedArray.sort((a, b) => a - b);

    for (let i = 0; i < numberOfJsonItems; ++i) {
        let optionToAdd = document.createElement("option");
        optionToAdd.innerHTML = sortedArray[i];

        for (let j = 0; j < numberOfJsonItems; ++j) {
            if (current_report[j].item.split(" ")[0] == sortedArray[i]) {
                optionToAdd.setAttribute("value", "#row" + current_report[j].item_code);
                optionToAdd.setAttribute("index", current_report[j].item_code);
                selectTagToAdd.appendChild(optionToAdd);
                break;
            }
        }
        // optionToAdd.setAttribute("value", "#row" + i);
        // optionToAdd.setAttribute("index", i);
        // selectTagToAdd.appendChild(optionToAdd);
    }
    $("#dropDownOverview").replaceWith(selectTagToAdd);
}

function showTable(counter) {
    let elementID = "weekView" + counter;
    document.getElementById(elementID).setAttribute("style", "display: visible");
}

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function get_todays_date() {
    let current = document.getElementById("current");
    let today = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    current.innerHTML = "Last Updated: " + today.toLocaleDateString(undefined, options) +
        " at " + formatAMPM(today);
}

function fillTable() {
    let jsonArray = current_report;
    let numOfJsonOb = jsonArray.length;

    if (numOfJsonOb === 0) {
        let table = document.getElementById("MainTable");
        let row = table.insertRow(1);

        let item = row.insertCell(0);
        let total_req = row.insertCell(1);
        let current_inv = row.insertCell(2);
        let lead_time = row.insertCell(3);
        let lead_time_qty = row.insertCell(4);
        let order_qty = row.insertCell(5);
        let order_date = row.insertCell(6);
        let PO = row.insertCell(7);

        item.innerHTML = "N/A";
        total_req.innerHTML = "N/A";
        current_inv.innerHTML = "N/A";
        lead_time.innerHTML = "N/A";
        lead_time_qty.innerHTML = "N/A";
        order_qty.innerHTML = "N/A";
        order_date.innerHTML = "N/A";
        PO.innerHTML = "N/A";
    } else {

        for (let i = 0; i < numOfJsonOb; ++i) {
            let table = document.getElementById("MainTable");
            let row = table.insertRow(1);
            row.setAttribute("id", "row" + current_report[i].item_code);
            row.setAttribute("class", "row-" + jsonArray[i].flag);
            row.addEventListener('click', function (e) {
                if (weekView.style.display === "none") {
                    weekView.setAttribute("style", "display: visible");
                } else {
                    weekView.setAttribute("style", "display: none");
                }
            });
            row.setAttribute("style", "cursor: pointer; cursor: hand;");

            let item = row.insertCell(0);
            let total_req = row.insertCell(1);
            let current_inv = row.insertCell(2);
            let lead_time = row.insertCell(3);
            let lead_time_qty = row.insertCell(4);
            let order_date = row.insertCell(5);
            let future_order_qty = row.insertCell(6);
            let incomming_qty = row.insertCell(7);
            let PO = row.insertCell(8);

            item.innerText = jsonArray[i].item;
            total_req.innerHTML = jsonArray[i].total_req;
            current_inv.innerHTML = jsonArray[i].current_inv;
            lead_time.innerHTML = jsonArray[i].lead_time;
            lead_time_qty.innerHTML = jsonArray[i].lead_time_qty;
            incomming_qty.innerHTML = jsonArray[i].incomming_qty;
            order_date.innerHTML = jsonArray[i].order_date;
            PO.innerHTML = jsonArray[i].PO;
            future_order_qty.innerHTML = jsonArray[i].order_qty

            let weekView = document.createElement("td");
            weekView.setAttribute("id", "weekView" + i);
            weekView.setAttribute("colspan", "8");
            weekView.setAttribute("class", "table-bordered");
            weekView.setAttribute("style", "display:none;");

            row = table.insertRow(2);
            row.appendChild(weekView);
            
            
            getWeekView(i, weekView);
        }
    }
}


function getWeekView(itemIndex, weekView) {
    let jsonArray = current_report;

    let tableToAdd = document.createElement('table');
    let itemName = jsonArray[itemIndex];
    //Set the Monthly Header
    let monthHeader = tableToAdd.insertRow(0);
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();

    for (let i = currentMonth; i < 12; ++i) {
        let cell = document.createElement('th');
        cell.setAttribute("class", "gray");
        cell.innerText = calendar[i];
        monthHeader.appendChild(cell);
    }

    for (let i = 0; i < currentMonth; ++i) {
        let cell = document.createElement('th');
        cell.setAttribute("class", "gray");
        cell.innerText = calendar[i];
        monthHeader.appendChild(cell);
    }
    //console.log(itemName);

    //Get the data and set the calendar
    let calendarInfo = tableToAdd.insertRow(1);
    for (let j = currentMonth; j < 12; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].parts_calendar[j][2]);
        cell.innerHTML = jsonArray[itemIndex].parts_calendar[j][1];
        calendarInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].parts_calendar[j][2]);
        cell.innerHTML = jsonArray[itemIndex].parts_calendar[j][1];
        calendarInfo.appendChild(cell);
    }

    weekView.appendChild(tableToAdd);
    return;
}

function init_timer_update() {
    let current = document.getElementById("current");
    minElapsed = 0;
    current.innerHTML = "Last Updated: " + minElapsed + " minutes ago";
}

function update_timer_since_last_update() {
    minElapsed++;
    let current = document.getElementById("current");
    current.innerHTML = "Last Updated: " + minElapsed + " minutes ago";
}

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
          _x += el.offsetLeft - el.scrollLeft;
          _y += el.offsetTop - el.scrollTop;
          el = el.offsetParent;
    }
    return { top: _y, left: _x };
    }

frappe.ready(async function () {
    //frappePostRequest()
    // get_todays_date();
    init_timer_update();
    //fillTable();
    await fillTableDriver();

    document.getElementById('refreshButton').addEventListener('click', function (e) {
        // fillTable();
        fillTableDriver();
        init_timer_update();
    });

    //For Total Req
    let numOfTotalReqButtonClicked = true;
    document.getElementById('sortTotalReqButton').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestTotalReq);

        if (numOfTotalReqButtonClicked) {
            fillTable();
            numOfTotalReqButtonClicked = false;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfTotalReqButtonClicked = true;
        }

    });

    //For Current Inv
    let numOfCurrentInvButtonClicked = 0;
    document.getElementById('sortCurrentInvButton').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestcurrentInv);

        if (numOfCurrentInvButtonClicked % 2 === 0) {
            fillTable();
            numOfCurrentInvButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfCurrentInvButtonClicked++;
        }

    });

    //For Lead Time
    let numOfLeadTimeButtonClicked = 0;
    document.getElementById('sortLeadTimeButton').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestLeadTime);

        if (numOfLeadTimeButtonClicked % 2 === 0) {
            fillTable();
            numOfLeadTimeButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfLeadTimeButtonClicked++;
        }

    });

    //For Lead Time Quantity
    let numOfLeadTimeQtyButtonClicked = 0;
    document.getElementById('sortLeadTimeQty').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestNextInv);

        if (numOfLeadTimeQtyButtonClicked % 2 === 0) {
            fillTable();
            numOfLeadTimeQtyButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfLeadTimeQtyButtonClicked++;
        }

    });

    //For Order Date
    let numOfOrderDateButtonClicked = 0;
    document.getElementById('sortByDate').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        if (numOfOrderDateButtonClicked % 2 === 0) {
            clearTable(table);
            current_report = bubbleSort(current_report, orderDateAsc);
            fillTable();
            numOfOrderDateButtonClicked++;
        } else {
            clearTable(table);
            current_report = bubbleSort(current_report, orderDateDesc);
            fillTable();
            numOfOrderDateButtonClicked++;
        }

    });

    //For Future Quantity
    let numOfFutureQtyButtonClicked = 0;
    document.getElementById('sortByFutureOrder').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestFutureOrder);

        if (numOfFutureQtyButtonClicked % 2 === 0) {
            fillTable();
            numOfFutureQtyButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfFutureQtyButtonClicked++;
        }

    });

    //For Incoming Quantity
    let numOfIncomingQtyButtonClicked = 0;
    document.getElementById('sortIncomingQty').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestIncomingQty);

        if (numOfIncomingQtyButtonClicked % 2 === 0) {
            fillTable();
            numOfIncomingQtyButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfIncomingQtyButtonClicked++;
        }

    });

});


function clearTable(table) {
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

// refrenced and modified from https://flexiple.com/bubble-sort-javascript/
function bubbleSort(jsonArray, compareFunction) {
    let len = jsonArray.length - 1;
    let modified;
    do {
        modified = false;
        for (let i = 0; i < len; i++) {
            if (compareFunction(jsonArray[i], jsonArray[i + 1])) {
                let tmp = jsonArray[i];
                jsonArray[i] = jsonArray[i + 1];
                jsonArray[i + 1] = tmp;
                modified = true;
            }
        }
    } while (modified);
    return jsonArray;
};


function orderDateAsc(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.order_date > jsonObjectTwo.order_date;
}

function orderDateDesc(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.order_date < jsonObjectTwo.order_date;
}

function lowestTotalReq(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.total_req < jsonObjectTwo.total_req;
}

function lowestcurrentInv(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.current_inv < jsonObjectTwo.current_inv;
}

function lowestLeadTime(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.lead_time < jsonObjectTwo.lead_time;
}

function lowestNextInv(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.lead_time_qty < jsonObjectTwo.lead_time_qty;
}

function lowestFutureOrder(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.order_qty < jsonObjectTwo.order_qty;
}

function lowestIncomingQty(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.incomming_qty < jsonObjectTwo.incomming_qty;
}

async function sortAndRefreshTable(sortingFunction) {
    let table = document.getElementById("MainTable");
    clearTable(table)
    let sorted_report = bubbleSort(current_report, sortingFunction);
    fillTable(sorted_report);
}

async function fillTableDriver() {
    let table = document.getElementById("MainTable");
    clearTable(table)
    let row = table.insertRow(1);
    row.classList.add("loadingIcon");
    row.innerHTML = `<td class="loadingIconParent" colspan="8"><i class="loadingIcon fas fa-spinner fa-spin fa-5x"></i></td>`;
    // current_report = await getItemReportFromDatabase();
    let sorted_report = bubbleSort(current_report, orderDateDesc);
    clearTable(table);
    fillTable(sorted_report);
    console.log("##### OBJECT #####");
    console.log(sorted_report);
    console.log("##### String #####");
    console.log(JSON.stringify(sorted_report));


    // create drop down menu for items
    set_ID_drop_down();
    let dropDownMenu = document.getElementById("dropDown");
    dropDownMenu.onchange = function () {
        // window.scrollTo(0, 0);
        // let hrefTogo = this.value;
        // let index = this.options[this.selectedIndex].getAttribute('index');
        // setTimeout(function() {
        //     window.location.href = hrefTogo;
        //     showTable(index);
        // }, 1000);

        document.documentElement.scrollTop = 0;
        window.location.href = this.value;
        let index = this.options[this.selectedIndex].getAttribute('index');
        showTable(index);
        if (index > current_report.length - 5) {
            window.scrollBy(0, -250);
        }
        // $('html').animate({scrollTop: $(this.value).offset().top}, slow);
        // let index = this.options[this.selectedIndex].getAttribute('index');
        // showTable(index);
    };


    // set_ID_drop_down();
    // let dropDownMenu = document.getElementById("dropDown");
    // let topOfDashboard = document.getElementById("page-card");
    // let topPos = topOfDashboard.offsetTop;

    // dropDownMenu.onchange = function () {
    //     // window.scrollTo(0, 0);
    //     // let hrefTogo = this.value;
    //     // let index = this.options[this.selectedIndex].getAttribute('index');
    //     // setTimeout(function() {
    //     //     window.location.href = hrefTogo;
    //     //     showTable(index);
    //     // }, 1000);

    //     let elem = document.querySelector(this.value);
    //     let selectedElement = elem.getBoundingClientRect();
    //     console.log(selectedElement);

    //     let x = getOffset(document.getElementById(this.value)).left;
    //     let y = getOffset(document.getElementById(this.value)).top;

    //     console.log("x: "+ x);
    //     console.log("y: "+ y);

    //     // window.scrollTo(selectedElement.x, selectedElement.y + topOfDashboard);

    //     // window.location.href = this.value;
    //     let index = this.options[this.selectedIndex].getAttribute('index');
    //     showTable(index);
    // };
}